import { session } from "./session";

export namespace database {
    let spreadsheet: null | GoogleAppsScript.Spreadsheet.Spreadsheet = null;

    const baseUserColumnIndex = 7;
    const baseSessionRawIndex = 5;

    const sessionProperties = ["sessionUUID", "sessionName", "sessionStart", "sessionEnd"] as const;

    function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
        if (spreadsheet !== null)
            return spreadsheet;
        spreadsheet = SpreadsheetApp.getActive();
        return spreadsheet;
    }

    export function getUserIndex(userKey: string): null | number {
        const query = getSpreadsheet().getSheetByName("query");
        query?.getRange(1, 1).setValue(`=MATCH("${userKey}",userInfo!A2:A,0)`);
        const value = query?.getRange(1, 1, 1, 1).getValue();
        if (value !== "#N/A") {
            return parseInt(value);
        }
        return null;
    }

    export function getUserInfo(userKey: string): { userKey: string, userEmail: string } | null {
        const query = getSpreadsheet().getSheetByName("query");
        query?.getRange(1, 1).setValue(`=QUERY(userInfo!A2:B,"WHERE A='${userKey}'")`);
        const values = query?.getRange(1, 1, 1, 2).getValues()[0];
        if (!values) return null;
        if (values[0] === "#N/A") return null;
        return { userKey: values[0], userEmail: values[1] };

    }

    export function addUser(userKey: string, userEmail: string) {
        const userInfo = getSpreadsheet().getSheetByName("userInfo");
        userInfo?.appendRow([userKey, userEmail]);
        return getUserIndex(userKey);
    }

    export function createSessionTable(sessionUUID: string, sessionName: string, startDate: Date): number | null {
        const attendance = getSpreadsheet().getSheetByName("attendance");
        if (!attendance) return null;
        const sessionInfo: Record<typeof sessionProperties[number], string | null> = {
            sessionUUID,
            sessionName,
            sessionStart: Utilities.formatDate(startDate, "JST", "yyyy/MM/dd hh:mm"),
            sessionEnd: null,
        }
        attendance.appendRow(sessionProperties.map(property => sessionInfo[property]));
        return attendance.getLastRow() - baseSessionRawIndex;
    }

    export function writeSessionEnd(sessionRowIndex: number, sessionEnd: Date) {
        const attendance = getSpreadsheet().getSheetByName("attendance");
        const rowIndex = baseSessionRawIndex + sessionRowIndex;
        const columnSessionEndIndex = sessionProperties.findIndex((value) => value == "sessionEnd");
        if (columnSessionEndIndex == -1) return;
        const columnIndex = columnSessionEndIndex + 1;
        attendance?.getRange(rowIndex, columnIndex)?.setValue(Utilities.formatDate(sessionEnd, "JST", "yyyy/MM/dd hh:mm"),)
    }

    export type AttendanceState = "host" | "absent" | "noRecord";

    export function setAttendanceState(sessionUUID: string, userKey: string, state: AttendanceState): boolean {
        const attendance = getSpreadsheet().getSheetByName("attendance");
        const sessionInfo = session.getSession(sessionUUID);
        if (!sessionInfo) return false;
        const userIndex = getUserIndex(userKey);
        if (!userIndex) return false;
        const rowIndex = baseSessionRawIndex + sessionInfo.sessionRowIndex;
        const columnIndex = baseUserColumnIndex + userIndex;
        attendance?.getRange(rowIndex, columnIndex, 1)?.setValue(state);
        return true;
    }
}