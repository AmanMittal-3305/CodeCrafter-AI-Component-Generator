import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Select from 'react-select';
import { BsStars } from 'react-icons/bs';
import { HiOutlineCode } from 'react-icons/hi';
import Editor from '@monaco-editor/react';
import { IoCloseSharp, IoCopy } from 'react-icons/io5';
import { PiExportBold } from 'react-icons/pi';
import { ImNewTab } from 'react-icons/im';
import { FiRefreshCcw } from 'react-icons/fi';
import { GoogleGenAI } from "@google/genai";
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import LivePreview from './LiveReactPreview';

const Home = () => {

  // ✅ Fixed typos in options
  const options = [
    { value: 'html-css', label: 'HTML + CSS' },
    { value: 'html-tailwind', label: 'HTML + Tailwind CSS' },
    { value: 'html-bootstrap', label: 'HTML + Bootstrap' },
    { value: 'react-js', label: 'React JS' },
    { value: 'react-tailwind', label: 'React + Tailwind CSS' },
    { value: 'react-bootstrap', label: 'React + Bootstrap' },
    { value: 'next-js', label: 'Next JS' },
    { value: 'angular', label: 'Angular JS' },
  ];

  const [outputScreen, setOutputScreen] = useState(false);
  const [tab, setTab] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [frameWork, setFrameWork] = useState(options[0]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewTabOpen, setIsNewTabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // ✅ Extract code safely
  function extractCode(response) {
    const match = response.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : response.trim();
  }

  // ⚠️ API Key (you said you want it inside the file)
  const ai = new GoogleGenAI({
    apiKey: apiKey
  });

  // ✅ Improved AI Response Handler with Retry & Error Messages
  // ✅ Improved AI Response Handler with framework-specific logic
  async function getResponse() {
    if (!prompt.trim()) return toast.error("Please describe your component first");

    try {
      setLoading(true);
      setOutputScreen(true);

      const maxRetries = 3;
      let attempt = 0;
      let response = null;

      // ✅ Framework-specific instructions
      const frameworkInstructions = {
        "html-css": "Return a complete HTML + CSS code inside a single HTML file.",
        "html-tailwind": "Return a complete HTML file using Tailwind CSS via CDN.",
        "html-bootstrap": "Return a complete HTML file using Bootstrap via CDN.",
        "react-js": "Return only React component code in JSX format, without <html>, <body>, or <script> tags.",
        "react-tailwind": "Return a React component using Tailwind CSS (JSX only).",
        "react-bootstrap": "Return a React component using Bootstrap (JSX only).",
        "next-js": "Return a Next.js page component (use JSX, no HTML shell). Add 'use client' if needed.",
        "angular": "Return Angular component code with .ts, .html, and .css parts if applicable.",
      };

      const selectedInstruction =
        frameworkInstructions[frameWork.value] || "Return clean, formatted code.";

      while (attempt < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
You are an experienced frontend developer skilled in multiple frameworks. 
Generate a modern, animated, and responsive component for: ${prompt}.
Framework to use: ${frameWork.label}.

${selectedInstruction}

Requirements:
- Focus on responsiveness, animation, and visual design.
- Include hover effects, animations, and clean structure.
- Return ONLY the code, wrapped in a Markdown code block (like \`\`\`jsx ... \`\`\`).
- Do NOT include explanations or comments.
          `,
          });

          if (response) break; // ✅ success
        } catch (err) {
          attempt++;
          if (err.message.includes("503")) {
            console.warn(`Retrying (${attempt}/${maxRetries}) due to model overload...`);
            await new Promise((res) => setTimeout(res, 2000 * attempt)); // backoff delay
          } else {
            throw err;
          }
        }
      }

      if (!response) throw new Error("Model unavailable after multiple retries");

      const text = typeof response.text === "function" ? response.text() : response.text;
      setCode(extractCode(text));
    } catch (error) {
      console.error(error);
      if (error.message.includes("503")) {
        toast.error("Gemini is temporarily overloaded. Please try again in a few seconds.");
      } else {
        toast.error("Something went wrong while generating code");
      }
    } finally {
      setLoading(false);
    }
  }



  // ✅ Copy Code
  const copyCode = async () => {
    if (!code.trim()) return toast.error("No code to copy");
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy");
    }
  };

  // ✅ Download Code
  const downnloadFile = () => {
    if (!code.trim()) return toast.error("No code to download");

    // ✅ Map frameworks to proper file extensions
    const extensionMap = {
      'html-css': 'html',
      'html-tailwind': 'html',
      'html-bootstrap': 'html',
      'react-js': 'jsx',
      'react-tailwind': 'jsx',
      'react-bootstrap': 'jsx',
      'next-js': 'jsx',
      'angular': 'ts'
    };

    const extension = extensionMap[frameWork.value] || 'html';
    const fileName = `CodeCrafter-Code.${extension}`;

    // ✅ Adjust MIME type for better compatibility
    const mimeType = {
      html: 'text/html',
      jsx: 'text/javascript',
      ts: 'text/typescript'
    }[extension] || 'text/plain';

    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    toast.success(`File downloaded as ${fileName}`);
  };


  return (
    <>
      <Navbar />

      {/* ✅ Better responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 lg:px-16">
        {/* Left Section */}
        <div className="w-full py-6 rounded-xl bg-[#141319] mt-5 p-5">
          <h3 className='text-[25px] font-semibold sp-text'>AI Component Generator</h3>
          <p className='text-gray-400 mt-2 text-[16px]'>Describe your component and let AI code it for you.</p>

          <p className='text-[15px] font-[700] mt-4'>Framework</p>
          <Select
            className='mt-2'
            options={options}
            value={frameWork}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#111",
                borderColor: "#333",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { borderColor: "#555" }
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#111",
                color: "#fff"
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "#333"
                  : state.isFocused
                    ? "#222"
                    : "#111",
                color: "#fff",
                "&:active": { backgroundColor: "#444" }
              }),
              singleValue: (base) => ({ ...base, color: "#fff" }),
              placeholder: (base) => ({ ...base, color: "#aaa" }),
              input: (base) => ({ ...base, color: "#fff" })
            }}
            onChange={(selected) => setFrameWork(selected)}
          />

          <p className='text-[15px] font-[700] mt-5'>Describe your component</p>
          <textarea
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
            className='w-full min-h-[200px] rounded-xl bg-[#09090B] mt-3 p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            placeholder="Describe your component in detail and AI will generate it..."
          ></textarea>

          <div className="flex items-center justify-between mt-3">
            <p className='text-gray-400 text-sm'>Click on generate button to get your code</p>
            <button
              onClick={getResponse}
              className="flex items-center p-3 rounded-lg border-0 bg-gradient-to-r from-blue-400 to-blue-600 px-5 gap-2 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
            >
              {loading ? <ClipLoader color='white' size={18} /> : <BsStars />}
              Generate
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative mt-2 w-full h-[80vh] bg-[#141319] rounded-xl overflow-hidden">
          {
            !outputScreen ? (
              <div className="w-full h-full flex items-center flex-col justify-center">
                <div className="p-5 w-[70px] flex items-center justify-center text-[30px] h-[70px] rounded-full bg-gradient-to-r from-blue-400 to-blue-600">
                  <HiOutlineCode />
                </div>
                <p className='text-[16px] text-gray-400 mt-3'>Your component & code will appear here.</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="bg-[#17171C] w-full h-[50px] flex items-center gap-3 px-3">
                  <button
                    onClick={() => setTab(1)}
                    className={`w-1/2 py-2 rounded-lg transition-all ${tab === 1 ? "bg-blue-600 text-white" : "bg-zinc-800 text-gray-300"}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setTab(2)}
                    className={`w-1/2 py-2 rounded-lg transition-all ${tab === 2 ? "bg-blue-600 text-white" : "bg-zinc-800 text-gray-300"}`}
                  >
                    Preview
                  </button>
                </div>

                {/* Toolbar */}
                <div className="bg-[#17171C] w-full h-[50px] flex items-center justify-between px-4">
                  <p className='font-bold text-gray-200'>Code Editor</p>
                  <div className="flex items-center gap-2">
                    {tab === 1 ? (
                      <>
                        <button onClick={copyCode} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><IoCopy /></button>
                        <button onClick={downnloadFile} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><PiExportBold /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setIsNewTabOpen(true)} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><ImNewTab /></button>
                        <button onClick={() => setRefreshKey(prev => prev + 1)} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><FiRefreshCcw /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor / Preview */}
                <div className="h-full">
                  {tab === 1 ? (
                    <Editor value={code} height="100%" theme='vs-dark' language="html" />
                  ) : (
                    <>
                      {/* Framework-aware preview */}
                      {tab === 2 && (
                        ["html-css", "html-tailwind", "html-bootstrap"].includes(frameWork.value) ? (
                          <iframe
                            key={refreshKey}
                            srcDoc={code}
                            className="w-full h-full bg-white text-black"
                            sandbox="allow-scripts"
                          />
                        ) : (
                          <LivePreview code={code} framework={frameWork.value} key={refreshKey} />
                        )
                      )}

                    </>
                  )}
                </div>

              </>
            )
          }
        </div>
      </div>

      {/* ✅ Fullscreen Preview Overlay */}
      {isNewTabOpen && (
        <div className="absolute inset-0 bg-white w-screen h-screen overflow-auto">
          <div className="text-black w-full h-[60px] flex items-center justify-between px-5 bg-gray-100">
            <p className='font-bold'>Preview</p>
            <button onClick={() => setIsNewTabOpen(false)} className="w-10 h-10 rounded-xl border border-zinc-300 flex items-center justify-center hover:bg-gray-200">
              <IoCloseSharp />
            </button>
          </div>
          <iframe srcDoc={code} className="w-full h-[calc(100vh-60px)]"></iframe>
        </div>
      )}
    </>
  )
}

export default Home