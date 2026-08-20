import mammoth from "mammoth";

const clean = (text="") => text
  .replace(/\r\n/g,"\n")
  .replace(/\u00a0/g," ")
  .replace(/[ \t]+\n/g,"\n")
  .replace(/\n{3,}/g,"\n\n")
  .trim();

function dateFrom(text){
  return text.slice(0,800).match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i
  )?.[0] || null;
}

function durationFrom(text){
  return text.match(/Transcription ended after\s+(\d{1,2}:\d{2}:\d{2})/i)?.[1] || null;
}

function speakersFrom(text){
  const speakers=new Map();
  for(const line of text.split("\n")){
    const m=line.match(/^([^:\n]{2,80}):\s+(.+)$/);
    if(!m) continue;
    const s=m[1].trim();
    if(/^\d{1,2}:\d{2}(?::\d{2})?$/.test(s)) continue;
    speakers.set(s.toLowerCase(),s);
  }
  return [...speakers.values()];
}

function normalize(text){
  const lines=clean(text).split("\n");
  const out=[]; let stamp=null;
  for(const raw of lines){
    const line=raw.trim();
    if(!line) continue;
    if(/^\d{1,2}:\d{2}:\d{2}$/.test(line)){stamp=line;continue;}
    if(/^Transcription ended after/i.test(line) ||
       /^This editable transcript was computer generated/i.test(line) ||
       /^People can also change the text/i.test(line)) continue;

    const m=line.match(/^([^:\n]{2,80}):\s*(.*)$/);
    if(m){
      out.push(stamp?`[${stamp}] ${m[1].trim()}: ${m[2].trim()}`:`${m[1].trim()}: ${m[2].trim()}`);
      stamp=null;
    } else if(out.length){
      out[out.length-1]+=` ${line}`;
    } else out.push(line);
  }
  return out.join("\n");
}

function build(rawText,sourceFormat,sourceName){
  const raw=clean(rawText);
  if(!raw) throw new Error("Transcript is empty.");
  const normalizedText=normalize(raw);
  return {
    rawText:raw,
    normalizedText,
    sourceFormat,
    sourceName,
    metadata:{
      detected_date:dateFrom(raw),
      detected_duration:durationFrom(raw),
      detected_speakers:speakersFrom(raw),
      raw_character_count:raw.length,
      normalized_character_count:normalizedText.length,
    }
  };
}

export async function parseTranscriptFile(file){
  const ext=file.name.split(".").pop()?.toLowerCase()||"";
  if(ext==="docx"){
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return build(result.value,"docx",file.name);
  }
  if(ext==="txt") return build(await file.text(),"txt",file.name);
  throw new Error("Transcript Importer v1 supports DOCX and TXT.");
}

export function parsePastedTranscript(text){
  return build(text,"pasted_text","Pasted transcript");
}

export async function sha256Text(text){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
