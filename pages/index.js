import Header from '@components/Header'
import Progress from '@components/Progress'
import {useState, useEffect} from 'react';
import { useRouter } from "next/router";
import {getGenre, 
  outlineGenerator, 
  statePopulator,
  plotSummaryGenerator,
  plotChapterArrayGenerator
} from '/utils/serverSide.js';
import {defaultAppState} from '/utils/state.js';
import download from "downloadjs";

export async function getServerSideProps() {
  const config = {
      "modelChoice": "gpt35",
      "chapterLength": 10,
      "desiredPages": 50,
      "padAmount": 5
  }
  return { props: { config } }
}

export default function Page({config}) {
  const router = useRouter();
  const [textOutput, setTextOutput] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [appState, setAppState] = useState(defaultAppState(config))
  const [appCurrentStep, setAppCurrentStep] = useState(0);


  /* If we chain a bunch of awaits, the frontend wont update while 
     backend is thinking. This is a workaround so the state changes
     and a useEffect triggers the next step. This has a side effect
     of also updating the frontend after each step.
  */

  useEffect(() => {
    switch(true) {
      case appCurrentStep === 0: 
        break;
      case appCurrentStep === 1: 
        generateOutline();
        break;
      case appCurrentStep === 2:
        generateHashMap();
        break;
      case appCurrentStep === 3:
        generatePlotSummary();
        break;
      case appCurrentStep === 4:
        // Current finishing point
        generatePlotChapterArray();
        break;
      case appCurrentStep === 5:
        // Current finishing point
        setThinking(false);
        setGenerating(false);
        break;
      default:
        console.log("Default state something went wrong");
        break;
    }
  }, [appCurrentStep]);

  function formatDownload(output) {
    let string = "";
    for(var a = 0; a < output.length; a++) {
      if(Array.isArray(output[a]) === false) {
        string += output[a] + "\n";
      } else {
        string += "\n" + output[a].join("\n") + "\n";
      }
    }
    return string;
  }

  async function generateOutline() {
    setGenerating(true);
    setThinking(true);

    // Refresh the state and output
    let thisState = defaultAppState(config);
    let thisOutput = [];
    setAppState(thisState);
    setTextOutput(thisOutput);

    const genre = getGenre();
    thisOutput.push("Genre: " + genre);
    setTextOutput(thisOutput);
    thisState.plotGenre = genre;
    await outlineGenerator(thisState).then((res) => {
      thisState.rawOutline = res;
      thisOutput.push(res.split("\n"));
      setTextOutput(thisOutput);
      setAppState(thisState);
      setAppCurrentStep(2);
    }).catch((err) => {
      console.log("Something broke in step 1", err);
      setThinking(false);
      setGenerating(false);
    })
  }

  async function generateHashMap() {

    // Generate each hash map value
    let itemsToPopulateHashMap = {
      'plotOutline': 'plot',
      'mainCharacters': 'main characters list',
      'minorCharacters': 'minor characters list',
      'plotSettings': 'setting',
      'writingStyle': 'writing style',
      'writingAdjectives': 'writing adjectives list'
    }
    let thisState = appState;
    let thisOutput = textOutput;

    for (const [key, keyVal] of Object.entries(itemsToPopulateHashMap)) {
      await statePopulator(thisState, keyVal).then((res) => {
        console.log("3 RESULT", res);
        thisState[key] = res;
        setAppState(thisState);
        thisOutput.push(res.split("\n"));
      }).catch((err) => {
        console.log("Something broke in step 2", key, err);
        setThinking(false);
        setGenerating(false);
      });
    }
    // Finished:
    setTextOutput(thisOutput);
    setAppCurrentStep(3);
  }

  async function generatePlotSummary() {
    let thisState = appState;
    let thisOutput = textOutput;

    const awaitOutline = await outlineGenerator(thisState).then((res) => {
      console.log("4 RESULT", res);
      thisState.chapterByChapterSummaryString = res;
      thisOutput.push(res.split("\n"));
      setTextOutput(thisOutput);
      setAppState(thisState);
      setAppCurrentStep(4);
    }).catch((err) => {
      console.log("Something broke in step 3", err);
      setThinking(false);
      setGenerating(false);
    })
  }

  async function generatePlotChapterArray() {
    let thisState = appState;
    let thisOutput = textOutput;

    await plotChapterArrayGenerator(thisState).then((res) => {
      console.log("5 RESULT", res);
      thisState.chapterSummaryArray = res;
      for(var x in res) {
        thisOutput.push(res[x]);
      }
      setTextOutput(thisOutput);
      setAppState(thisState);
      setAppCurrentStep(5);
    }).catch((err) => {
      console.log("Something broke in step 4", err);
      setThinking(false);
      setGenerating(false);
    })
  }

  return (
    <>
      <div className="min-h-full">
        <Header />
        <main className="-mt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white px-5 py-6 shadow sm:px-6">
              {appCurrentStep > 0 && appCurrentStep !== 5 && <Progress currentStep={appCurrentStep}/>}
              {!generating && <button className="p-3 m-3 outline" onClick={() => setAppCurrentStep(1)}>{appCurrentStep === 0 ? "Generate" : "Try Again"}</button>}
              {!thinking && !generating && textOutput.length > 1 && <button className="p-3 m-3 outline" onClick={() => download(formatDownload(textOutput), "BookGen.txt", "text/plain")}>Download story</button>}
              {textOutput && textOutput.map((output, a) => (
                <div className="mb-6" key={`output-${a}`}>
                  {/* Single line response with no line breaks */}
                  {Array.isArray(output) === false && <p>{output || " "}</p>}
                  {/* Multi line response with line breaks */}
                  {Array.isArray(output) === true &&  output.map((line, b) => {
                    if(line.length > 1) {
                      return <p key={`output-${a}-line-${b}`}>{line}</p>
                    } else {
                      return <p key={`output-${a}-line-${b}`}>&nbsp;</p>
                    }
                  })}
                </div>
              ))}
              {thinking && <div> Thinking... <img className="h-32 w-auto" src="/thinking.gif" /> </div>}
              <h1 className="mt-10 text-lg font-bold mb-2"> Debug Goodies: </h1>
              <h1>App current step: {appCurrentStep}</h1>
              <h2>Raw Output Array</h2>
              <pre className="code">{JSON.stringify(textOutput, 0 ,2)}</pre>
              <h2>App State</h2>
              <pre className="code">{JSON.stringify(appState, 0 ,2)}</pre>
              <h2>App Config</h2>
              <pre className="code">{JSON.stringify(config, 0 ,2)}</pre>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}