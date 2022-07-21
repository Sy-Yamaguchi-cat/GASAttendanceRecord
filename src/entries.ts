import { engine } from "./engine";
import { database } from "./database";

export namespace entries {
    const getEntries = ["index", "attend"] as const;
    const postEntries = ["register"] as const;
    const entries = [...getEntries, ...postEntries];
    export type Entry = (typeof entries)[number];

    export function getEntry(method: "GET" | "POST", event: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): Entry {
        const entry = event.parameter["entry"];
        return ((method == "GET" ? getEntries : postEntries) as readonly string[]).includes(entry) ? entry as Entry : entries[0];
    }


    const executeFunctions: Record<Entry, (event: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) => GoogleAppsScript.HTML.HtmlOutput> = {
        index: (event) => {
            const templatePath = engine.getTemplateFilePath("index");
            const userKey = Session.getTemporaryActiveUserKey();
            const userEmail = Session.getActiveUser().getEmail();
            const userInfo = database.getUserInfo(userKey);
            if (!userInfo) database.addUser(userKey, userEmail);
            return engine.getHtmlFile(templatePath, {
                userKey,
                userEmail,
                userInfo,
            });
        },
        attend: (event) => {
            const templatePath = engine.getTemplateFilePath("attend");
            return engine.getHtmlFile(templatePath, {});
        },
        register: (event) => {
            const templatePath = engine.getTemplateFilePath("register");
            return engine.getHtmlFile(templatePath, {});
        },
    };

    export function execute(method: "GET" | "POST", event: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): GoogleAppsScript.HTML.HtmlOutput {
        const entry = getEntry(method, event);
        return executeFunctions[entry](event);
    }
}
