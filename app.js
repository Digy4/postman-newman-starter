const newman = require("newman")

newman.run({
    collection: require('./Sample.postman_collection.json'), 
    reporters: ['digy4', 'htmlextra']
}, process.exit)