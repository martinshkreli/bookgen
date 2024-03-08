const askOpenAI = async function (prompt, role, modelChoice = 'gpt-3.5-turbo', tokens=5000, temp=0.85) {
    let now = new Date();
    // let model = 'gpt-3.5-turbo' // //gpt-4-0314
    console.log("%%%%%%% ASKING OPEN AI", process.env.API_KEY);

    let roleContent = "You are an ChatGPT-powered chat bot."
    
    if (role == 'machine') {
        roleContent = "You are a computer program attempting to comply with the user's wishes."
    }

    if (role == 'writer') {
        roleContent = "You are a professional fiction writer who is a best-selling author. You use all of the rhetorical devices you know to write a compelling book."
    }

    return new Promise(function(resolve, reject) {
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            'headers': {
                'Content-Type': 'application/json',

                // TODO: Figure out why the f this isn't passing from process.env
                'Authorization': `Bearer ${process.env.API_KEY}`,
            },
            'body': JSON.stringify({
                'model': modelChoice,
                "messages": [
                    {"role": "system", "content": roleContent},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": tokens,
                "temperature": temp,
            })
        }).then(async response => {
            const data = await response.text();
            try {
                if (JSON.parse(data) && !!data) {
                    resolve (JSON.parse(data));
                    return JSON.parse(data);
                } else {
                    resolve ('error')
                    return 'error';
                }
            } catch(e) {
                console.log(data);
                console.log(e);
            }
        })
        .then(async data => {
            console.log(data);
            try {
                let elapsed = new Date() - now;
                console.log('\nOpenAI response time: ' + elapsed + 'ms\n')
                resolve (data)
                return data;
            } catch(e) {
                console.log(e);
                resolve (e);
                return e;
            }
        }).catch((err) => {
            console.log("You fucked up");
            return err;
        })
    });
}

exports.askOpenAI = askOpenAI;
