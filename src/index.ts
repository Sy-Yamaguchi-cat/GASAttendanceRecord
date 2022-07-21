import { entries } from "./entries"

function doGet(event: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
    return entries.execute("GET", event);
}
