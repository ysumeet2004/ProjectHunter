const project = require('../models/project');
const user = require('../models/user');
async function projectMaker(req, res) {
  const { title, desc, skills, domain } = req.body;

  console.log('Incoming project data:', { title, desc, skills, domain, user: req.user });
  console.log(JSON.stringify(req.user, null, 2));

  const newProject = new project({
    title,
    desc,
    skills_req: skills,
    domain,
    createdBy: req.user.id // Must come from verifyToken
  });

  await newProject.save();
  res.redirect('/');
}

async function showAll(req, res) {
  try {
    const myProjects = await project.find({ createdBy: req.user.id,status: "OPEN"  }).populate('applicants.user');

    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Filter applicants per project
    const filteredProjects = myProjects.map(project => {
      const filteredApplicants = project.applicants.filter(app => {
        return new Date(app.appliedAt) >= cutoff;
      });

      return {
        ...project.toObject(),
        applicants: filteredApplicants
      };
    });

    res.render('my-projects', { projects: filteredProjects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).send("Server Error");
  }
}


async function findFilterHandler(req, res) {
  try {
    const selectedDomains = req.query.domains; // checkbox values

    let query = {
      status: 'OPEN', // ✅ Only show active/open projects
    };

    if (selectedDomains) {
      if (Array.isArray(selectedDomains)) {
        query.domain = { $in: selectedDomains };
      } else {
        query.domain = selectedDomains;
      }
    }

    const projects = await project.find(query);
    res.render('finder', {
      projects,
      selectedDomains: selectedDomains || [],
      currentUserId: req.user.id // ✅ Pass user's ID to EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
}


async function myApplicationHandler(req, res) {
  try {
    const userId = req.user.id;
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Fetch all projects the user has applied to recently
    const appliedProjects = await project.find({
      applicants: {
        $elemMatch: {
          user: userId,
          appliedAt: { $gte: cutoff }
        }
      },
      status: 'OPEN' // ✅ Only show non-finished projects
    }).populate('createdBy');

    // Filter out approved ones and add local status tag (pending/rejected)
    const filtered = appliedProjects
      .filter(proj => !proj.approved_user || proj.approved_user.toString() !== userId)
      .map(proj => {
        let status;
        if (!proj.approved_user) {
          status = 'Pending';
        } else {
          status = 'Rejected';
        }
        return {
          ...proj.toObject(),
          applicationStatus: status
        };
      });

    res.render('application', { projects: filtered });
  } catch (err) {
    console.error("Error loading applications:", err);
    res.status(500).send("Server Error");
  }
}


async function projectApplicantsHandler(req, res) {
  try {
    const project_ = await project.findOne({
      _id: req.params.projectId,
    }).populate({
      path: 'applicants.user',
      model: 'user'
    });

    if (!project_) return res.status(404).send('Project not found or is already finished');

    res.render('applicants', { project_ });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
}


async function IDKHandler(req, res) {
  try {
    const { projectId, applicantId } = req.params;

    // Find the project
    const targetProject = await project.findById(projectId);
    if (!targetProject) {
      return res.status(404).send('Project not found');
    }

    // Check if the applicant exists in the applicants list
    const isApplicantPresent = targetProject.applicants.some(app => app.user.toString() === applicantId);
    if (!isApplicantPresent) {
      return res.status(404).send('Applicant not found in the list');
    }

    // Set the approved_user
    targetProject.approved_user = applicantId;
    targetProject.status = 'FINISHED';

    // Optionally, remove the applicant from the applicants array
    targetProject.applicants = targetProject.applicants.filter(app => app.user.toString() !== applicantId);

    // Save the changes
    await targetProject.save();

    res.redirect(`/projects/show`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
}

async function showHistoryPage(req, res) {
  const userId = req.user.id;

  const createdHistory = await project.find({
    createdBy: userId,
    status: 'FINISHED',
  }).populate('approved_user');

  const appliedHistory = await project.find({
    approved_user: userId,
    status: 'FINISHED',
  }).populate('createdBy');

  res.render('history', {
    createdHistory,
    appliedHistory,
    show: 'applied', // default toggle view
  });
}
module.exports = {showHistoryPage,projectMaker,showAll,findFilterHandler,myApplicationHandler,projectApplicantsHandler,IDKHandler};