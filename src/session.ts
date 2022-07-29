import { database } from "./database";

export namespace session {
    let scriptProperties: GoogleAppsScript.Properties.Properties | null = null;

    const activeSessionsPropertyName = "activeSessions";

    export type SessionInfo = {
        sessionName: string;
        sessionStart: Date;
        sessionUUID: string;
        createdBy: {
            userKey: string;
            userEmail: string;
        };
        sessionRowIndex: number;
    };

    function getScriptProperties(): GoogleAppsScript.Properties.Properties {
        if (scriptProperties !== null) {
            return scriptProperties;
        }
        scriptProperties = PropertiesService.getScriptProperties();
        return scriptProperties;
    }

    export function getActiveSessins() {
        const scriptProperties = getScriptProperties();
        const activeSessionsProperty = scriptProperties.getProperty(activeSessionsPropertyName);
        return JSON.parse(activeSessionsProperty ?? "[]") as SessionInfo[];
    }

    export type AttendanceState = "host" | "present" | "off" | "absent";

    export function setSessionAattendance(userKey: string, sessionUUID: string, state: AttendanceState) {
        const sessionInfo = getSession(sessionUUID);
        if (!sessionInfo) return false;
        if (state === "host" &&
            sessionInfo.createdBy.userKey !== userKey) {
            return false;
        } else if (state === "present" &&
            sessionInfo.sessionStart > new Date()) {
            return false;
        }
        return database.setAttendanceState(sessionInfo, userKey, state);
    }

    export function doneSession(userKey: string, sessionUUID: string) {
        const scriptProperties = getScriptProperties();
        const targetSession = getSession(sessionUUID);
        let activeSessions = getActiveSessins();
        if (!targetSession || targetSession.createdBy.userKey !== userKey) return activeSessions;
        activeSessions = activeSessions.filter(
            (value) => value.sessionUUID !== sessionUUID || value.createdBy.userKey !== userKey
        );
        scriptProperties.setProperty(activeSessionsPropertyName, JSON.stringify(activeSessions))
        database.writeSessionEnd(targetSession.sessionRowIndex, new Date());
        return activeSessions;
    }

    export function getSession(sessionUUID: string): SessionInfo | null {
        const activeSessions = getActiveSessins();
        return activeSessions.find((value) => value.sessionUUID === sessionUUID) ?? null
    }

    export function createSession(sessionName: string, startDate: Date): SessionInfo | null {
        const scriptProperties = getScriptProperties();
        const activeSessions = getActiveSessins();

        const sessionUUID = Utilities.getUuid();
        const sessionRowIndex = database.createSessionTable(sessionUUID, sessionName, startDate);
        if (sessionRowIndex === null) return null;

        const sessionInfo: SessionInfo = {
            sessionName,
            sessionStart: startDate,
            sessionUUID,
            sessionRowIndex,
            createdBy: {
                userKey: Session.getTemporaryActiveUserKey(),
                userEmail: Session.getActiveUser().getEmail(),
            },
        };
        const nextActiveSessions: SessionInfo[] = [...activeSessions, sessionInfo];
        scriptProperties.setProperty(activeSessionsPropertyName, JSON.stringify(nextActiveSessions));
        return sessionInfo;
    }

}