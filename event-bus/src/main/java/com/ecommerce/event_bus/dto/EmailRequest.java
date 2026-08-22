public class EmailRequest {
    private String text;
    private String email;
    private String subject;
    /** Optional attachment: file name shown in the mail client (e.g. invoice-<id>.pdf). */
    private String attachmentName;
    /** Optional attachment: raw bytes encoded as Base64 (keep payloads small). */
    private String attachmentBase64;

    public EmailRequest() {
    }

    public EmailRequest(String text, String email, String subject) {
        this.text = text;
        this.email = email;
        this.subject = subject;
    }

    public EmailRequest(String text, String email, String subject, String attachmentName, String attachmentBase64) {
        this.text = text;
        this.email = email;
        this.subject = subject;
        this.attachmentName = attachmentName;
        this.attachmentBase64 = attachmentBase64;
    }

    public boolean hasAttachment() {
        return attachmentBase64 != null && !attachmentBase64.isBlank()
                && attachmentName != null && !attachmentName.isBlank();
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public String getAttachmentBase64() {
        return attachmentBase64;
    }

    public void setAttachmentBase64(String attachmentBase64) {
        this.attachmentBase64 = attachmentBase64;
    }
}
