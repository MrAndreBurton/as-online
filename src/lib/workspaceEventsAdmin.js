import { supabase } from "./supabase";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke(
    "workspace-events-admin",
    { body }
  );

  if (error) throw error;
  if (!data?.ok) {
    throw new Error(data?.error || "Workspace Events action failed.");
  }

  return data;
}

export const recoverWorkspaceSubscription = () =>
  invoke({ action: "recover" });

export const getWorkspaceSubscriptionStatus = () =>
  invoke({ action: "status" });

export const renewWorkspaceSubscription = () =>
  invoke({ action: "renew" });

export const checkWorkspaceOperation = (operationName) =>
  invoke({ action: "check_operation", operationName });
