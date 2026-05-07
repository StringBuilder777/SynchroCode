import { supabase } from "./supabase";

export async function checkAndRedirectIfNoOrganization(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      return false; // No session
    }

    const userMetadata = session.user?.user_metadata;
    const organizationId = userMetadata?.organizationId;

    if (!organizationId) {
      // No organization found, redirect to setup
      window.location.href = "/org-setup";
      return false;
    }

    // Organization exists
    return true;
  } catch (error) {
    console.error("Error checking organization:", error);
    return false;
  }
}

export async function getUserOrganizationId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const organizationId = data.session?.user?.user_metadata?.organizationId;
    return organizationId || null;
  } catch (error) {
    console.error("Error getting organization ID:", error);
    return null;
  }
}
