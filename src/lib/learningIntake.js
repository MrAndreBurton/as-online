import { supabase } from "./supabase";

export async function fetchTranscriptImportSessions(){
  const {data,error}=await supabase
    .from("aeos_sessions")
    .select(`
      session_id,scheduled_start_at,session_status,session_title,
      student:student_profiles(user_id,first_name,last_name,display_name),
      offering:aeos_offerings(offering_id,offering_name)
    `)
    .order("scheduled_start_at",{ascending:false})
    .limit(100);
  if(error) throw error;
  return data??[];
}

export async function importTranscriptToLIE(payload){
  const {data,error}=await supabase.rpc("aeos_import_transcript_to_lie",{
    target_session_id:payload.sessionId,
    target_source_provider:payload.sourceProvider,
    target_source_format:payload.sourceFormat,
    target_source_name:payload.sourceName,
    target_raw_text:payload.rawText,
    target_normalized_text:payload.normalizedText,
    target_content_sha256:payload.contentSha256,
    target_extracted_metadata:payload.extractedMetadata,
  });
  if(error) throw error;
  return data;
}

export async function fetchRecentLearningIntake(){
  const {data,error}=await supabase
    .from("aeos_learning_intake_items")
    .select(`
      intake_item_id,intake_type,source_provider,source_name,
      processing_status,match_status,received_at,
      student:student_profiles(first_name,last_name,display_name),
      offering:aeos_offerings(offering_name)
    `)
    .order("received_at",{ascending:false})
    .limit(20);
  if(error) throw error;
  return data??[];
}
