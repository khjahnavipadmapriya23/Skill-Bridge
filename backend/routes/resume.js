const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { dbGet, dbRun, dbAll } = require('../database');
const { authenticateToken, logUserActivity } = require('./auth');

// Multer memory storage configuration for clean file-upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit resume size to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT file formats are supported.'));
    }
  }
});

// GET: Fetch current resume analysis status
router.get('/', authenticateToken, async (req, res) => {
  try {
    const resume = await dbGet('SELECT * FROM resume_data WHERE user_id = ?', [req.user.id]);
    if (!resume || !resume.uploaded_file) {
      return res.json({ uploaded: false });
    }

    const extracted = JSON.parse(resume.extracted_skills || '[]');
    
    // Fetch target role details to map resume analysis
    const user = await dbGet('SELECT target_role_id FROM users WHERE id = ?', [req.user.id]);
    
    let comparison = null;
    let suggestions = [];

    if (user && user.target_role_id) {
      const role = await dbGet('SELECT role_name FROM roles WHERE role_id = ?', [user.target_role_id]);
      const required = await dbAll(
        `SELECT s.skill_name FROM role_skills rs 
         JOIN skills s ON rs.skill_id = s.skill_id 
         WHERE rs.role_id = ?`,
        [user.target_role_id]
      );

      const requiredNames = required.map(r => r.skill_name);
      const matched = requiredNames.filter(r => extracted.some(e => e.toLowerCase() === r.toLowerCase()));
      const missing = requiredNames.filter(r => !extracted.some(e => e.toLowerCase() === r.toLowerCase()));
      const matchScore = requiredNames.length > 0 ? Math.round((matched.length / requiredNames.length) * 100) : 0;

      comparison = {
        targetRole: role.role_name,
        requiredSkills: requiredNames,
        matchedSkills: matched,
        missingSkills: missing,
        matchScore
      };

      // Generate smart suggestions
      if (missing.length > 0) {
        suggestions = missing.map(skill => {
          return `Missing keyword: "${skill}". Add experience or projects relating to "${skill}" on your resume to pass automated screens.`;
        });
      } else {
        suggestions = [`Excellent! Your resume covers all core requirements for ${role.role_name}. Add quantifiable accomplishments (e.g. "improved performance by 30%") to stand out.`];
      }
    } else {
      suggestions = ['Please select a target role in your Profile to see direct matching insights and improvement suggestions.'];
    }

    res.json({
      uploaded: true,
      fileName: resume.uploaded_file,
      extractedSkills: extracted,
      comparison,
      suggestions
    });
  } catch (error) {
    console.error('Fetch resume info error:', error);
    res.status(500).json({ message: 'Error retrieving resume info.' });
  }
});

// POST: Upload and Parse Resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF or TXT resume file.' });
  }

  try {
    let parsedText = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      parsedText = pdfData.text;
    } else {
      parsedText = req.file.buffer.toString('utf-8');
    }

    // Keyword Extraction Logic
    const allSkills = await dbAll('SELECT skill_name FROM skills');
    const matchedSkills = [];
    const lowerText = parsedText.toLowerCase();

    for (const skill of allSkills) {
      const skillName = skill.skill_name.toLowerCase();
      // Regex checking for boundary matches
      const escaped = skillName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');

      if (regex.test(lowerText) || lowerText.includes(` ${skillName} `) || lowerText.includes(skillName)) {
        matchedSkills.push(skill.skill_name);
      }
    }

    // Save/Update in ResumeData
    const skillsJson = JSON.stringify(matchedSkills);
    await dbRun(
      `INSERT INTO resume_data (user_id, uploaded_file, extracted_skills) 
       VALUES (?, ?, ?) 
       ON CONFLICT(user_id) DO UPDATE SET uploaded_file = ?, extracted_skills = ?`,
      [req.user.id, req.file.originalname, skillsJson, req.file.originalname, skillsJson]
    );

    await logUserActivity(
      req.user.id, 
      `Uploaded resume (${req.file.originalname}). Extracted ${matchedSkills.length} skills automatically.`
    );

    res.json({
      message: 'Resume uploaded and parsed successfully!',
      fileName: req.file.originalname,
      extractedSkills: matchedSkills
    });
  } catch (error) {
    console.error('Resume upload/parse error:', error);
    res.status(500).json({ message: 'Error processing resume file.' });
  }
});

module.exports = router;
