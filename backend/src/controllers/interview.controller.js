// Import the PDFParse class from v2 of the pdf-parse package
const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * Backward compatibility helper to mimic the classic v1 pdf-parse function call.
 * This satisfies the controller's requirement of calling `await pdfParse(req.file.buffer)`
 * while remaining fully compatible with the v2 library currently installed in node_modules.
 * 
 * @param {Buffer} buffer The PDF file buffer to parse
 * @returns {Promise<{text: string}>} Result containing parsed text
 */
async function pdfParse(buffer) {
    const parser = new PDFParse({ data: buffer })
    try {
        const result = await parser.getText()
        return result
    } finally {
        // Always destroy the parser instance to release memory resources
        await parser.destroy()
    }
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    // Parse the PDF buffer using our compatibility wrapper function
    const data = await pdfParse(req.file.buffer)
    const resumeContent = data.text
    const { selfDescription, jobDescription } = req.body

    // Call the AI service helper with the parsed resume text content
    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription
    })

    // Ensure title is provided - extract from job description if AI doesn't provide one
    const title = interViewReportByAi.title || jobDescription.split('\n')[0] || "Interview Report"

    // Save the generated report along with inputs in the MongoDB database
    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent,
        selfDescription,
        jobDescription,
        ...interViewReportByAi,
        title
    })

    //console.log(interViewReportByAi)

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })

    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }