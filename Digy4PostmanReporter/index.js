const fs = require('fs');
const path = require('path');

Digy4PostmanReport = function (newman, options, collectionRunOptions) {
    
    // Object to collect all events
    const eventData = {};
    let pass = 0 
    let fail = 0 
    let skipped = 0 
    
    // Helper function to safely stringify objects with circular references
    function safeClone(obj) {
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        }));
    }

    // Helper function to add event data
    function addEventData(eventName, data) {
        if (!eventData[eventName]) {
            eventData[eventName] = [];
        }
        eventData[eventName].push(safeClone(data));
    }

    newman.on('start', function(err, o) {
        if (err) { 
            console.error('Error in start:', err);
            return;
        }
        addEventData('start', o);
    })

    newman.on('beforeIteration', function(err, o) {
        if (err) { 
            console.error('Error in beforeIteration:', err);
            return;
        }
        addEventData('beforeIteration', o);
    })

    newman.on('beforeItem', function(err, o) {
        if (err) { 
            console.error('Error in beforeItem:', err);
            return;
        }
        addEventData('beforeItem', o);
    })

    newman.on('beforePrerequest', function(err, o) {
        if (err) { 
            console.error('Error in beforePrerequest:', err);
            return;
        }
        addEventData('beforePrerequest', o);
    })

    newman.on('prerequest', function(err, o) {
        if (err) { 
            console.error('Error in prerequest:', err);
            return;
        }
        addEventData('prerequest', o);
    })

    newman.on('beforeRequest', function(err, o) {
        if (err) { 
            console.error('Error in beforeRequest:', err);
            return;
        }
        addEventData('beforeRequest', o);
    })

    newman.on('request', function(err, o) {
        if (err) { 
            console.error('Error in request:', err);
            return;
        }
        addEventData('request', o);
    })

    newman.on('beforeTest', function(err, o) {
        if (err) { 
            console.error('Error in beforeTest:', err);
            return;
        }
        addEventData('beforeTest', o);
    })

    newman.on('test', function(err, o) {
        if (err) { 
            console.error('Error in test:', err);
            return;
        }
        addEventData('test', o);
    })

    newman.on('beforeScript', function(err, o) {
        if (err) { 
            console.error('Error in beforeScript:', err);
            return;
        }
        addEventData('beforeScript', o);
    })

    newman.on('script', function(err, o) {
        if (err) { 
            console.error('Error in script:', err);
            skipped++; 
            return;
        }
        addEventData('script', o);
    })

    newman.on('item', function(err, o) {
        if (err) { 
            console.error('Error in item:', err);
            return;
        }
        addEventData('item', o);
    })

    newman.on('iteration', function(err, o) {
        if (err) { 
            console.error('Error in iteration:', err);
            return;
        }
        addEventData('iteration', o);
    })

    newman.on('assertion', function(err, o) {
        if (err) { 
            console.error('Error in assertion:', err);
            fail++; 
            return;
        }

        if (o.skipped) { 
            skipped++
        }
        pass++
        addEventData('assertion', o);
    })

    newman.on('console', function(err, o) {
        if (err) { 
            console.error('Error in console:', err);
            return;
        }
        addEventData('console', o);
    })

    newman.on('exception', function(err, o) {
        if (err) { 
            console.error('Error in exception:', err);
            return;
        }
        addEventData('exception', o);
    })

    newman.on('beforeDone', function(err, o) {
        if (err) { 
            console.error('Error in beforeDone:', err);
            return;
        }
        addEventData('beforeDone', o);
    })

    newman.on('done', function(err, o) {
        if (err) { 
            console.error('Error in done:', err);
            return;
        }
        addEventData('done', o);
        
        // Write the complete event data to a JSON file
        const filename = options.export || 'newman-events.json';
        const outputPath = path.resolve(filename);
        
        try {
            fs.writeFileSync(outputPath, JSON.stringify(eventData, null, 2));
            console.log(`\n📄 Newman events saved to: ${outputPath}`);
            console.log(`📊 Captured ${Object.keys(eventData).length} different event types`);
            
            // Show summary of events captured
            Object.keys(eventData).forEach(eventName => {
                console.log(`   ${eventName}: ${eventData[eventName].length} events`);
            });
            console.log(`Total pass: ${pass}`)
            console.log(`Total fail: ${fail}`)
            console.log(`Total skipped: ${skipped}`)
        } catch (writeError) {
            console.error('Error writing events file:', writeError);
        }
    })
}

module.exports = Digy4PostmanReport