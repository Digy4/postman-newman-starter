
function DummyReporter(newman, options, collectionRunOptions) {
    console.log(JSON.stringify(options, null, 2))
    console.log(JSON.stringify(collectionRunOptions, null, 2))
    newman.on('done', async function(err, o){ 
        console.log("Dummy here")
        console.log("Before fetch")
        // fetch("https://httpbin.org/get")
        // .then(response => { 
        //     console.log("Response: ", JSON.stringify(response, null, 2))
        // })
        // .catch(error => { 
        //     console.error("Error: ", error)
        // })
        try {

            const response = await fetch("https://httpbin.org/get")
            
            if (response.ok) { 
                console.log("Good")
                const data = await response.json()
                console.log('Response: ', JSON.stringify(data, null, 2))
            }else { 
                console.log("Bad")
            }
            console.log("Outside of fetch")
        }catch(error) { 
            console.error(error)
        }
    })
}

module.exports = DummyReporter