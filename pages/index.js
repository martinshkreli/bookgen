import Header from '@components/Header'
import {useState, useEffect} from 'react';
import { useRouter } from "next/router";
import {getGenre, outlineGenerator, statePopulator} from '/utils/serverSide.js';
import {defaultAppState} from '/utils/state.js';
import download from "downloadjs";

export async function getServerSideProps() {
  const config = {
      "modelChoice": "gpt35",
      "chapterLength": 2,
      "desiredPages": 10,
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

  console.log("APP STATE",  appState);

  useEffect(() => {
    //GET THE GENRE!
  }, []);

  async function generateStory() {
    setGenerating(true);
    setThinking(true);

    // Refresh the state and output
    let thisState = defaultAppState(config);
    let freshOutput = [];
    setAppState(thisState);
    setTextOutput(freshOutput);

    const genre = getGenre();
    freshOutput.push("Genre: " + genre);
    setTextOutput(freshOutput);
    thisState.plotGenre = genre;

    // Generate the outline
    setThinking(true);
    try {
      const awaitOutline = await outlineGenerator(thisState).then((res) => {
        console.log("THE RESULT", res);
        setThinking(false);

        // Update the state
        thisState.rawOutline = res;
        setAppState(thisState);
        
        // We're gonna split this cause otherwise we need to use dangerouslySetInnerHTML
        freshOutput.push(res.split("\n"));
        setTextOutput(freshOutput);
        setAppState(thisState);
      });
    } catch {
      setThinking(false);
      setGenerating(false);
    }

    // Generate each hash map value
    let itemsToPopulateHashMap = {
      'plotOutline': 'plot',
      'mainCharacters': 'main characters list',
      'minorCharacters': 'minor characters list',
      'plotSettings': 'setting',
      'writingStyle': 'writing style',
      'writingAdjectives': 'writing adjectives list'
    }

    setThinking(true);

    try {
      for (const [key, keyVal] of Object.entries(itemsToPopulateHashMap)) {
        const stateItem = await statePopulator(thisState, keyVal).then((res) => {
          console.log("THE RESULT", res);
          thisState[key] = res;
          setAppState(thisState);
          // We're gonna split this cause otherwise we need to use dangerouslySetInnerHTML
          freshOutput.push(res.split("\n"));
          setTextOutput(freshOutput);
        });
      }
    } catch {
      setThinking(false);
      setGenerating(false);
    }

    setThinking(false);

    // End of the road
    setGenerating(false);
  }

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

  return (
    <>
      <div className="min-h-full">
        <Header />
        <main className="-mt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white px-5 py-6 shadow sm:px-6">

              {!generating && <button className="p-3 m-3 outline" onClick={() => generateStory()}>Generate</button>}
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
              <h1 className="mt-10"> Debug Goodies: </h1>
              <pre className="code">{JSON.stringify(textOutput, 0 ,2)}</pre>
              <pre className="code">{JSON.stringify(appState, 0 ,2)}</pre>
              <pre className="code">{JSON.stringify(config, 0 ,2)}</pre>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}