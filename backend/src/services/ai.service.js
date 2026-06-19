const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
// Import the original zodToJsonSchema from the package
const { zodToJsonSchema: originalZodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

// Initialize the Google GenAI client
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

// Custom wrapper to solve compatibility issues between Zod 4.x and zod-to-json-schema.
// Zod 4 schemas have a built-in .toJSONSchema() method which we use directly, fallback to original if needed.
const zodToJsonSchema = (schema, options) => {
    if (schema && typeof schema.toJSONSchema === "function") {
        return schema.toJSONSchema()
    }
    return originalZodToJsonSchema(schema, options)
}

// Zod Schema representing the interview report structure
const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

/**
 * Generates an interview report based on resume, self description and job description.
 */
async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `
Act as an expert Technical Interviewer and Career Coach. 
Your task is to analyze the provided Resume and Job Description (JD) to generate a structured Interview Preparation Report.

### INPUT DATA:
- Resume: ${resume}
- Self Description: ${selfDescription}
- Job Description: ${jobDescription}

### GOAL:
Based on the candidate's background and the JD requirements, generate a JSON object that matches the schema exactly.
1. Identify the 'matchScore' based on skills.
2. Generate 'technicalQuestions' and 'behavioralQuestions' tailored to this specific candidate's gaps and strengths.
3. Identify 'skillGaps' (e.g., if the JD asks for .NET but they only know Node.js).
4. Create a 7-day 'preparationPlan' to help this candidate bridge those gaps.

### OUTPUT INSTRUCTIONS:
- Generate ONLY valid JSON.
- DO NOT use keys like 'candidate_details' or 'job_role'.
- USE ONLY these top-level keys: "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "title".
- Ensure 'severity' is strictly one of: "low", "medium", or "high".
- No conversational text before or after the JSON.
`;

    // Request response from Gemini 2.5 Flash using JSON schema for structured output format validation
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    // Parse and validate the response structure using the Zod schema before returning
    const report = interviewReportSchema.parse(
        JSON.parse(response.text)
    )

    return report
}

/**
 * Helper function to generate PDF buffer from HTML content via Puppeteer.
 */
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

/**
 * Generates a resume PDF based on resume text, self description and job description.
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    // Call Gemini 2.5 Flash with the responseSchema defined by the local schema
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
}