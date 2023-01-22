import { Configuration, OpenAIApi } from "openai";
import request from 'request';
import fs, { write } from 'fs';
const writeStream = fs.createWriteStream('story.txt');
const configuration = new Configuration({
    organization: "org-",
    apiKey: "sk-",
});
const openai = new OpenAIApi(configuration);
const response = await openai.listEngines();

async function runIt(parameter) {
    let prompt = `${parameter}`;

    let payload = {
        'method': 'POST',
        'url': 'https://api.openai.com/v1/completions',
        'headers': {
        'Content-Type': 'application/json',
        'Authorization': "Bearer sk-",
        },
        'body': JSON.stringify({
            'model': 'text-davinci-003',
        "prompt": prompt,
        "max_tokens": 4000,
        "temperature": 0.8,
        })
    };
    return new Promise(function (resolve, reject) {
        request(payload, (error, response, body) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                let body = JSON.parse(response.body);
                resolve(response);
            }
        });
    });
}

function singleQuestion(question) {
  let prompt = `${question}`;
  return runIt(prompt);
}
let story = [
    "Quest stood there, a picture of stillness and grace, his hands tucked into the pockets of his well-worn trousers. The sun shone down on him, painting his skin a golden hue, and his eyes glinted with a deep intelligence. He could feel the breeze rippling through his hair, and he breathed in the salty air. He was at peace in that moment, and the world seemed to stand still around him. He knew that his life was about to change, and he welcomed it with open arms.",
    "He was not motionless for long; his body soon stirred, and he began to walk slowly towards the shoreline. The sand was warm beneath his feet, betraying a heat that was not yet visible in the air, and he savoured the sensation as he walked. He felt a new energy coursing through his veins, and the anticipation of what lay ahead was electrifying. As he drew nearer the horizon, he could make out the distant shapes of fishing boats and the figures of seagulls wheeling in the sky. The ocean seemed to beckon him, and he felt himself drawn ever closer, as if pulled by an unseen force. He had no idea what awaited him, but he was sure of one thing – his life was about to take an unexpected turn.",
    "The salty smell of the sea filled his nostrils, and he was reminded of a time long past - a time when his life was lived in a different way, before the monotony of the modern day had dulled his senses. He continued towards the shoreline, eager to discover what was waiting for him. As he drew nearer, the sound of crashing waves and the cries of the seagulls grew louder, and the excitement of the unknown began to take hold. He could see the boats bobbing up and down in the water, and he felt an emotion he had not felt in a long time - hope. He was suddenly struck by the thought of setting sail on one of them, of travelling to some distant and undiscovered land, of exploring and of adventure. He picked up his pace, and soon the ocean was before him, vast and inviting. He stood, taking in the sight before him and marveling at the power of the sea. He felt a strange urge to jump in and let the waves carry him away, but he held back and instead took a deep breath as he stepped forward, his feet sinking into the sand, and all the while sensing that his life was about to take an unexpected turn.",
    "The sun blazed brightly in the sky, yet its warmth was a distant memory to the man as he felt the cold Atlantic spray wash against his skin. He could taste the salt, feel the power of the water as it thundered against the shore. He had seen enough of the sea in his life to know what was needed here: a vessel. He scanned the shore, hoping to find his salvation, and soon his gaze alighted on a weathered fishing boat, far from the shore but still visible in the depths of the bay. He set off, determined, and soon enough the boat was close enough for him to make out its details: it was small, but would do, with a single mast and a yellow sail. He clambered aboard, feeling the familiarity of the vessel that had once been his home. His journey was about to begin. With a few confident thrusts of the oar, he set off, letting the current take him as he set his sights on the horizon and the distant shores beyond. As the miles rolled by, the man felt a strange sense of anticipation - of what, he could not tell, but it was a feeling of longing, of hope. He had found the boat and a purpose, and that was enough. He was free, and his destination was open to him. With a smile, he allowed himself to be taken away by the wind and waves, his journey just beginning."
];
let storyOutline = [
    "The sun shone down on Quest, casting a golden hue on his skin, and his eyes glinted with intelligence as he stood there in peace, knowing his life was about to change.",
    "He was drawn to the shoreline, where he met a woman named Emmy, feeling a new energy as the anticipation of the unknown spurred him onward.",
    "The sun shone brightly in the sky and a gentle breeze blew through the trees, creating a peaceful atmosphere. He thought about his old friend David.",
    "The man found a boat to sail on that would take him on a journey with a feeling of anticipation and hope. On the journey he met the notorious troll named Ikk."
]

for (var i=0; i<250; i++){
  await singleQuestion(`Here are four one-sentence summaries of four paragraphs of a story. 1: ${storyOutline[i]} 2: ${storyOutline[i+1]} 3: ${storyOutline[i+2]} 4: ${storyOutline[i+3]}. Write a fifth fictional paragraph in the writing style of James Patterson that progresses the plot of the story. Vary the plot from the first four paragraphs. Make sure there is action, dialogue and do not be repetitive by starting each paragraph the words "The man".`).then((x) => {
    let response = JSON.parse(x.body);
    let tempans = response.choices[0].text;
    tempans = tempans.replace(/\n/g, '');
    console.log('Here is the new paragraph: ', tempans);
    story.push(tempans)});
  await singleQuestion(`Summarize this paragraph in one sentence: ${story[i+4]}`).then((x) => {
    let response = JSON.parse(x.body);
    let tempans = response.choices[0].text;
    tempans = tempans.replace(/\n/g, '');
    console.log('Here is the summary of that paragraph: ', tempans);
    storyOutline.push(tempans)
  });
}

story.forEach(value => writeStream.write(`${value}\n`));
writeStream.on('finish', () => {
  console.log('done writing file');
})
writeStream.end();