export namespace engine {
    export function getTemplateFilePath(entry: string): string {
        return `dist/${entry}.template.html`;
    }


    export function getHtmlFile(templatePath: string, resource: any) {
        const template = HtmlService.createTemplateFromFile(templatePath);
        template.origScript = `<script type="text/javascript">
    var GASPreload = {
        resource: ${JSON.stringify(resource)}
    };
    </script>`;
        return template.evaluate()
    }
}
