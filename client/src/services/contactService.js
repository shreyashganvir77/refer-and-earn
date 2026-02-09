import { request } from "./http";

export const contactService = {
  sendMessage({ name, email, subject, message }) {
    return request("/api/contact", {
      method: "POST",
      body: { name, email, subject, message },
    });
  },
};
