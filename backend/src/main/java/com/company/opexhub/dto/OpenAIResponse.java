package com.company.opexhub.dto;

import java.util.List;

public class OpenAIResponse {
    private List<Choice> choices;

    public static class Choice {
        private OpenAIMessage message;
        private String finish_reason;

        public OpenAIMessage getMessage() {
            return message;
        }

        public void setMessage(OpenAIMessage message) {
            this.message = message;
        }

        public String getFinish_reason() {
            return finish_reason;
        }

        public void setFinish_reason(String finish_reason) {
            this.finish_reason = finish_reason;
        }
    }

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }
}
