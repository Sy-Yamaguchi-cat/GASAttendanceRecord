function doGet() {
    const email = Session.getActiveUser().getEmail();
    const userKey = Session.getTemporaryActiveUserKey();
    const template = HtmlService.createTemplateFromFile("dist/index.template.html");
    template.origScript = `<script type="text/javascript">
var GASPreload = {
    resource: {
        email: "${email}",
        userKey: "${userKey}",
    }
};
</script>`;
    return template.evaluate();
}
