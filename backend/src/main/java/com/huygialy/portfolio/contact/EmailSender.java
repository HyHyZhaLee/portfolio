package com.huygialy.portfolio.contact;

/**
 * The port through which the contact feature emails the owner (backend guide principle 8). {@code ResendEmailSender}
 * implements it outside the local profile and {@code LoggingEmailSender} on a developer machine. Callers never hold a
 * transaction open while calling it (Non-Negotiable 7).
 */
public interface EmailSender {

    /**
     * Sends one email to the owner.
     *
     * @return the provider's message ID, or {@code null} when the provider accepted the email without one
     * @throws DeliveryException when the provider did not accept the email
     */
    String send(Email email);

    /**
     * One delivery attempt of a contact message. {@code toString} prints only the message ID and the attempt, because
     * the reply-to address and the text are the visitor's personal data (Non-Negotiable 9).
     */
    record Email(long messageId, int attempt, String replyTo, String subject, String text) {

        /**
         * The owner's email for the message's current attempt (PF-006 P9, D6): the email's subject line never holds content, so
         * the visitor's subject goes in the plain-text body (PF-028); replying goes to the visitor.
         */
        public static Email from(ContactMessageEntity message) {
            final long id = message.getId();
            final var visitorSubject = message.getSubject() == null ? "(none)" : message.getSubject();
            final var text = "Name: " + message.getName() + "\n"
                    + "Email: " + message.getEmail() + "\n"
                    + "Subject: " + visitorSubject + "\n"
                    + "Received: " + message.getCreatedAt() + "\n"
                    + "Message ID: " + id + "\n\n"
                    + message.getMessage() + "\n";
            return new Email(
                    id, message.getAttempts(), message.getEmail(), "New portfolio contact message (#" + id + ")", text);
        }

        /** The same key for every try within one attempt and a new one for each attempt (PF-006 D7). */
        public String idempotencyKey() {
            return "contact-message-" + messageId + "-attempt-" + attempt;
        }

        @Override
        public String toString() {
            return "Email[messageId=" + messageId + ", attempt=" + attempt + "]";
        }
    }

    /**
     * The provider did not accept an email. {@code reason} is a code such as {@code HTTP_503} or {@code IO_ERROR}, never
     * provider text (PF-006 D8); the exception never carries a cause, because a provider exception's message holds the
     * response body. {@code retryable} says whether trying again within the same attempt may succeed.
     */
    final class DeliveryException extends RuntimeException {

        private final String reason;
        private final boolean retryable;

        public DeliveryException(String reason, boolean retryable) {
            super(reason, null, false, false);
            this.reason = reason;
            this.retryable = retryable;
        }

        public String reason() {
            return reason;
        }

        public boolean retryable() {
            return retryable;
        }
    }
}
