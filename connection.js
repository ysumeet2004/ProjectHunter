const mongoose = require('mongoose');

function connectionHandler()
{
    mongoose.connect('mongodb://localhost:27017/project_handler').then(()=>{console.log(`[✅]DB`)});
}
module.exports = connectionHandler;
