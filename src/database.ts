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

    function executeQuery(queryString: string, range: [number, number]) {
        const query = getSpreadsheet().getSheetByName("query");
        const lock = LockService.getDocumentLock();
        if (lock.tryLock(5000)) {
            query?.getRange(1, 1).setValue(queryString);
            const value = query?.getRange(1, 1, ...range).getValues();
            lock.releaseLock();
            return (value && value[0][0] !== "#N/A") ? value : null;
        }
        return null;
    }

    export function getUserIndex(userKey: string): null | number {
        const value = executeQuery(`=MATCH("${userKey}",userInfo!A2:A,0)`, [1, 1]);
        if (value) {
            return parseInt(value[0][0]);
        }
        return null;
    }

    export function getUserInfo(userKey: string): { userKey: string, userEmail: string } | null {
        const values = executeQuery(`=QUERY(userInfo!A2:B,"WHERE A='${userKey}'")`, [1, 2]);
        if (!values) return null;
        return { userKey: values[0][0], userEmail: values[0][1] };

    }

    export function addUser(userKey: string, userEmail: string) {
        const userInfo = getSpreadsheet().getSheetByName("userInfo");
        userInfo?.appendRow([userKey, userEmail]);
        return getUserInfo(userKey);
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


    export function setAttendanceState(sessionInfo: session.SessionInfo, userKey: string, state: session.AttendanceState): boolean {
        const attendance = getSpreadsheet().getSheetByName("attendance");
        const userIndex = getUserIndex(userKey);
        if (!userIndex) return false;
        const rowIndex = baseSessionRawIndex + sessionInfo.sessionRowIndex;
        const columnIndex = baseUserColumnIndex + userIndex;
        attendance?.getRange(rowIndex, columnIndex, 1)?.setValue(state);
        return true;
    }
}