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
  fullText: [],
  pageSummaries: [],
}

state.chapters = Math.floor(state.desiredPages / chapterLength);

async function outlineGenerator(state){
  let outlinePrompt =  `Generate the outline of an original ${state.desiredpages}-page ${state.plotGenre} fiction book. Imagine and then carefully label the following: a plot, characters with names, settings and writing style. You have ${8000 - (40 + padAmount)} tokens remaining to write the outline. Use as many as possible.`;

  readline.cursorTo(process.stdout,2,2)
  process.stdout.write(`\x1b[35mGenerating Outline:`); 
  
  let outline = await askOpenAI(outlinePrompt, 'writer', 'gpt-4-0314', (8000 - (40 + padAmount)), 0.9)
  console.log(outline)
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

    let statePopulatorResult = await askOpenAI(statePopulatorPrompt, 'machine', 'gpt-4-0314', (8000 - (summaryLength + padAmount)), 0.9)

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

  let chapterSummaryText = await askOpenAI(`You are writing a book with this plot summary: ${state.plotOutline}. The book is ${state.desiredPages} pages long. Write a specific one-page plot summary for each of the ten chapters of the book. Name any unnamed major or minor characters. Use the first few chapters to introduce the characters and set the story. Use the next few chapters for action and character development. Use the last few chapters for dramatic twists in the plot and conclusion. You have ${8000 - (stringLength + padAmount)} tokens (or words) left for the summaries.`, 'writer', 'gpt-4-0314', (8000 - (stringLength + padAmount)), 0.9)
  
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
    console.log()
    console.log(shortSummaryLength);

    try {
      let shortSummaryText = ''
      while (shortSummaryText.length < 100) {
        console.log(`Generating short summary of Chapter ${i+1}:`);
        shortSummaryText = await askOpenAI(`You are writing Chapter ${i+1} of a ${state.chapters} chapter ${state.plotGenre} book. The plot summary for the entire book is ${state.plotOutline}. The summary of this chapter is ${state.chapterSummary[i]}. Write a 4-page summary of the chapter. Add new subplots, character development, character background, planned dialogue and plot development that you would typically find in such a work. You have ${8000 - (shortSummaryLength + padAmount)} tokens (or words) left for this.}`, 'writer', 'gpt-4-0314', (8000 - (shortSummaryLength + padAmount)), 0.9)

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

  console.log('\nentering page generation module\n');

  for (var i=0; i<state.chapters; i++){
    for (var j=0; j<20; j++) {

      let pageToWrite = i*20 + j+1;

      let amendment = ""
      if (j==0) {amendment = "This is the first page of the chapter.";}
      if (j == 1) {amendment = `Page 1 of this chapter reads as follows: ${state.fullText[(i*20 + j-1)]}`};
      if (j == 2) {amendment = `Pages ${j-1} and ${j} read as follows: ${state.fullText[(i*20 + j-2)]}. Page ${j} reads as follows: ${state.fullText[(i*20 + j-1)]}`;}
      if (j > 2) {
        amendment = `Pages ${j-2},${j-1} and ${j} read as follows: ${state.fullText[(i*20 + j-3)]} Page ${j-1} reads as follows: ${state.fullText[(i*20 + j-2)]} Page ${j} reads as follows: ${state.fullText[(i*20 + j -1)]}`;
        let tokenCount = countWords(amendment);
        console.log('word count for amendment is ', tokenCount, ' tokens: ', parseInt(tokenCount/0.66),10).toFixed(0)
      }
      
      //join the state.sentenceSummaries of all prior pages in the chapter so far
      let priorPages = '';
      for (var k=0; k<j; k++) {
        priorPages = priorPages + state.sentenceSummaries[(i*20 + k)];
      }

      console.log('\nGenerating final full text for chapter ', i+1, ' page ', j+1, '\n');
      
      let pageGenText = ''
      while (pageGenText.length < 100) {
        try {
          let pageGenText = await askOpenAI(`You are an author writing page ${j+1} in chapter ${i+1} of a ${state.chapters}-chapter ${state.plotGenre} novel. The plot summary for this chapter is ${state.chapterSummaryLong[i]}. ${amendment}. Here is a short summary of each prior page of this chapter you've written so far: ${priorPages}. As you continue writing the next page, be sure to develop the characters' background thoroughly, include dialogue and detailed literary descriptions of the scenery, and develop the plot. Do not mention page or chapter numbers! Do not jump to the end of the plot and make sure there is plot continuity. Carefully read the summaries of the prior pages before writing new plot. Make sure you fill an entire page of writing.`, 'writer', 'gpt-4-0314', 1500, 0.9)
          
          if (!pageGenText.choices[0]) {pageGenText = 'error'}
          if (!pageGenText.choices[0].message) {pageGenText = 'error'}
          if (!pageGenText.choices[0].message.content) {pageGenText = 'error'
          } else {
            pageGenText = pageGenText.choices[0].message.content;
            pageGenText = pageGenText.replace(/\n/g, '');
            state.fullText.push((pageGenText + "\n"));
            process.stdout.write(`\x1b[36m\n\n\nChapter ${i+1}\n\nPage ${j+1}\n\n ${pageGenText}\n\n`);
            fs.appendFile(`story${randomGenre}.txt`, pageGenText, (err) => {
              if (err) {
                throw err;
              }
            });
            async function generatePageSummary(page) {
              let goodToGo = false;
              let pageSummaryText = askOpenAI(`Here is a full page of text. Please summarize it in one, or at MOST, two sentences. ${page}`, 'writer', 'gpt-4-0314', 4000 - (pageGenLength + padAmount), 0.5)
              while (goodToGo == false) {
                try {
                  pageSummaryText = pageSummaryText.choices[0].message.content;
                  goodToGo = true;
                } catch (err) {
                  console.log(err)
                }
              }
              return page;
            }
            let pageSummary = await generatePageSummary(pageGenText)
            state.pageSummary.push(pageSummary);
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
    let chapterheader = `\n\nChapter ${i+1}\n\n`
    fs.appendFile(`story${randomGenre}.txt`, chapterheader, (err) => {
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