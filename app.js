require('dotenv').config();
const readline = require('readline');
const request = require("request");
const fs = require('fs');
const { resolve } = require('path');
const { askOpenAI } = require("./askOpenAI");

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

let models = {
  'gpt35': {
    name: 'gpt-3.5-turbo',
    tokenLimit: 4097,
  },
  'gpt4': {
    name: 'gpt-4-0314',
    tokenLimit: 8000,
  } 
}

let padAmount = 300;
let chapterLength = 20;

let genresList = ['Action', 'Adventure', 'Alternative History', 'Apocalyptic', 'Children\'s', 'Comedy', 'Crime', 'Cyberpunk', 'Drama', 'Dystopian', 'Elizabethan', 'Existentialist', 'Fantasy', 'Gothic', 'Historical', 'Horror', 'Legal', 'LGBTQ', 'Magical Realism', 'Mystery', 'Near-future', 'Parable', 'Paranormal', 'Post-Apocalyptic', 'Romance', 'Postmodern', 'Science Fiction', 'Sports', 'Star Trek Fan Fiction', 'Steampunk', 'Superhero', 'Supernatural', 'Teenage', 'Thriller', 'Tragedy', 'Utopian', 'Victorian', 'Western', 'Young Adult'];

let randomGenre = genresList[Math.floor(Math.random() * genresList.length)];
console.clear();
readline.cursorTo(process.stdout,1,1)
process.stdout.write(`\x1b[34mGenre is: ${randomGenre}`);

let state ={
  manuscript: [],  
  desiredPages: 200,
  chapters: 0,
  chapterText: [],
  chapterSummary: [],
  chapterSummaryLong: [],
  manuscriptSummaryToDate: '',
  plotOutline: '',
  plotGenre: randomGenre,
  mainCharacters: [],
  minorCharacters: [],
  plotSettings: [],  
  writingStyle: '',
  writingAdjectives: '',
  rawOutline: '',
  fullText: []
}

state.chapters = Math.floor(state.desiredPages / chapterLength);

async function outlineGenerator(state){
  let outlinePrompt =  `Generate the outline of an original ${state.desiredpages}-page ${state.plotGenre} fiction book. Imagine and then carefully label the following: a plot, characters with names, settings and writing style. You have ${8000 - (40 + padAmount)} tokens remaining to write the outline. Use as many as possible.`;

  readline.cursorTo(process.stdout,2,2)
  process.stdout.write(`\x1b[35mGenerating Outline:`); 
  
  let outline = await askOpenAI(outlinePrompt, 'writer', 'gpt-4-0314', (8000 - (40 + padAmount)), 0.8)
  outline = outline.choices[0].message.content;
  
  //  let templot = outline.replace(/\n/g, '');
  state.rawOutline = outline;
  readline.cursorTo(process.stdout,3,5);
  process.stdout.write(`\x1b[35mhere is the raw outline`);
  readline.cursorTo(process.stdout,4,6);
  process.stdout.write(`\x1b[34m${outline}`);
}

async function statePopulator(state){
  await outlineGenerator(state);
  
  console.log('\npopulating state from raw outline')
  let itemsToPopulateHashMap = {
    'plotOutline': 'plot',
    'mainCharacters': 'main characters',
    'minorCharacters': 'minor characters',
    'plotSettings': 'setting',
    'writingStyle': 'writing style',
    'writingAdjectives': 'writing adjectives'
  }

  for (const [key, keyVal] of Object.entries(itemsToPopulateHashMap)){
    let summaryToCount = `I'm going to give you the outline of a book. From this outline, tell me the ${keyVal}. You have 1234 tokens (or words) left for this page. Here is the outline: ${state.rawOutline}`;
    
    let summaryLength = countWords(summaryToCount);
    
    console.log(summaryLength)
    
    let statePopulatorPrompt = `I'm going to give you the outline of a book. From this outline, tell me the ${keyVal}. Use close to ${4097 - (summaryLength + padAmount)} words for this page. Here is the outline: ${state.rawOutline}`;

    let statePopulatorResult = await askOpenAI(statePopulatorPrompt, 'machine', 'gpt-4-0314', (8000 - (summaryLength + padAmount)), 0.8)

    statePopulatorResult = statePopulatorResult.choices[0].message.content;

    state[key] = statePopulatorResult;
    process.stdout.write(`\n\x1b[33m here is the ${keyVal}: ${statePopulatorResult}\n`);
  }
  
  process.stdout.write(`\n\x1b[34mhere is the state object:\n`)
  console.log(state);

  console.log('generating one sentence summaries');
  let stringToCount = `You are writing a book with this plot summary: ${state.plotOutline}. The book is ${state.desiredPages} pages long. Write a specific one-page plot summary for each of the ten chapters of the book. Name any unnamed major or minor characters. Use the first few chapters to introduce the characters and set the story. Use the next few chapters for action and character development. Use the last few chapters for dramatic twists in the plot and conclusion. You have 1234 tokens (or words) left for the summaries.`
  let stringLength = countWords(stringToCount);
  console.log(stringLength);

  let chapterSummaryText = await askOpenAI(`You are writing a book with this plot summary: ${state.plotOutline}. The book is ${state.desiredPages} pages long. Write a specific one-page plot summary for each of the ten chapters of the book. Name any unnamed major or minor characters. Use the first few chapters to introduce the characters and set the story. Use the next few chapters for action and character development. Use the last few chapters for dramatic twists in the plot and conclusion. You have ${8000 - (stringLength + padAmount)} tokens (or words) left for the summaries.`, 'writer', 'gpt-4-0314', (8000 - (stringLength + padAmount)), 0.8)
  
  chapterSummaryText = chapterSummaryText.choices[0].message.content;
  
  chapterSummaryText = chapterSummaryText.split(/\n/).filter((x) => x.length > 5);
  process.stdout.write(`\x1b[34mChapter Summary Text`)
  state.chapterSummary = chapterSummaryText;

  for (var i=0; i<state.chapters; i++){
    process.stdout.write(`\x1b[36mGenerating short summaries`)
    console.log('Chapter ', i+1);
    console.log(`asking chat gpt to write a summary of ${state.chapterSummary[i]}`)

    let shortSummaryPrompt = `You are writing Chapter ${i+1} of a ${state.chapters} chapter ${state.plotGenre} book. The plot summary for the entire book is ${state.plotOutline}. The summary of this chapter is ${state.chapterSummary[i]}. Write a several paragraph summary of the chapter. Add new subplots, character development, character background, planned dialogue and plot development that you would typically find in such a work. You have 1234 tokens (or words) left for this.}`

    let shortSummaryLength = countWords(shortSummaryPrompt);

    console.log(shortSummaryLength)
    try {
      let shortSummaryText = ''
      while (shortSummaryText.length < 100) {
        shortSummaryText = await askOpenAI(`You are writing Chapter ${i+1} of a ${state.chapters} chapter ${state.plotGenre} book. The plot summary for the entire book is ${state.plotOutline}. The summary of this chapter is ${state.chapterSummary[i]}. Write a 4-page summary of the chapter. Add new subplots, character development, character background, planned dialogue and plot development that you would typically find in such a work. You have ${8000 - (shortSummaryLength + padAmount)} tokens (or words) left for this.}`, 'writer', 'gpt-4-0314', (8000 - (shortSummaryLength + padAmount)), 0.8)

        if (!shortSummaryText.choices[0]) {shortSummaryText = 'error'}
        if (!shortSummaryText.choices[0].message) {shortSummaryText = 'error'}
        if (!shortSummaryText.choices[0].message.content) {
          shortSummaryText = 'error'
        } else {
          shortSummaryText = shortSummaryText.choices[0].message.content;
          shortSummaryText = shortSummaryText.replace(/\n/g, '');
          state.chapterSummaryLong.push(shortSummaryText);
          process.stdout.write(`\r\x1b[35mHere is the chapter summary: ${state.chapterSummaryLong[i]}`);
        }        
      }
    } catch (err) {
      console.log(err);
    }
  }

  console.log('entering page generation module');

  for (var i=0; i<state.chapters; i++){
    for (var j=0; j<20; j++) {
      let amendment = ""
      if (j==0) {amendment = "";}
      if (j !==0 ) {amendment = `Page ${j} reads as follows ${state.fullText[(i*j + j)]} `;}
      console.log('generating final full text for chapter ', i+1, ' page ', j+1);

      let pageGenPrompt = `You are a serious author writing page ${j+1} in chapter ${i+1} of a ${state.chapters}-chapter ${state.plotGenre} novel. The plot summary for this chapter is ${state.chapterSummaryLong[i]}. ${amendment} As you are writing, be sure to develop the characters background thoroughly, include dialogue and detailed literary descriptions of the scenery, and develop the plot. Do not mention page or chapter numbers! Do not jump to the end of the plot. The prior page reads as follows: You have 1234 tokens (or words) left for this page.`

      let pageGenLength = countWords(pageGenPrompt);
      let pageGenText = ''
      try {
        while (pageGenText.length < 100) {
          let pageGenText = await askOpenAI(`You are a serious author writing page ${j+1} in chapter ${i+1} of a ${state.chapters}-chapter ${state.plotGenre} novel. The plot summary for this chapter is ${state.chapterSummaryLong[i]}. ${amendment} As you are writing, be sure to develop the characters background thoroughly, include dialogue and detailed literary descriptions of the scenery, and develop the plot. Do not mention page or chapter numbers! Do not jump to the end of the plot. The prior page reads as follows: You have ${8000 - (pageGenLength + padAmount)} tokens (or words) left for this page.`, 'writer', 'gpt-4-0314', 8000 - (pageGenLength + padAmount), 0.8)
          
          pageGenText = pageGenText.choices[0].message.content;
          pageGenText = pageGenText.replace(/\n/g, '');
          state.fullText.push((pageGenText + "\n"));
        }
      } catch (err) {
        console.log(err);
      }
        fs.appendFile("story.txt", pageGenText, (err) => {
          if (err) {
            throw err;
          }
        });
          process.stdout.write(`\x1b[35mhere is the page text: ${pageGenText}`);
      }

    let chapterheader = `\n\nChapter ${i+1}\n\n`
    fs.appendFile("story.txt", chapterheader, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
statePopulator(state);

//1. Identify what the main theme or plot of the novel is going to be
//2. Brainstorm ideas for the main characters, their traits, and struggles.
//3. Create a timeline for the novel, including significant events and developments that will take place.
//4. Develop a setting for the novel, either real or imaginary.
//5. Establish the main characters and their motivations.
//6. Introduce the initial conflict and how it will be solved.
//7. Develop sub-plots for the novel using the characters and their struggles.
//8. Introduce necessary complications, such as other characters, that will further the story.
//9. Describe the environments, scenery, and settings that the characters will interact with
//10. Develop the climax of the novel and resolve the conflict
//11. Describe the resolution of the novel, explaining how it all wraps up
//12. Run the novel through Open AI and have it generate successive, non-repetitive chapters based on the initial input and timeline