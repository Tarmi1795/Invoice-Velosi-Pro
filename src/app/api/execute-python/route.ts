import { exec } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scriptName = body.scriptName || "merge_docs.py";
    
    // Path to the script relative to the project root
    const scriptPath = path.join(process.cwd(), "scripts", scriptName);

    return new Promise((resolve) => {
      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          resolve(NextResponse.json({ 
            success: false, 
            error: error.message,
            stderr: stderr 
          }, { status: 500 }));
          return;
        }
        
        resolve(NextResponse.json({ 
          success: true, 
          output: stdout,
          stderr: stderr 
        }));
      });
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to execute script" }, { status: 500 });
  }
}
