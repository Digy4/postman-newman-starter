const newman = require("newman")
const dotenv = require("dotenv")
dotenv.config()

newman.run({
    collection: require('./Sample.postman_collection.json'), 
    reporters: 'digy4',
    reporter: { 
        'digy4': { 
            suppressExitCode: true
        }
    }
})