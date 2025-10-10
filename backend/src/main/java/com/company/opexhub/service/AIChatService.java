// package com.company.opexhub.service;

// import com.company.opexhub.dto.*;
// import com.company.opexhub.entity.Initiative;
// import com.company.opexhub.entity.User;
// import com.company.opexhub.repository.InitiativeRepository;
// import com.company.opexhub.repository.UserRepository;
// import com.fasterxml.jackson.databind.ObjectMapper;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.http.*;
// import org.springframework.http.client.SimpleClientHttpRequestFactory;
// import org.springframework.stereotype.Service;
// import org.springframework.web.client.RestTemplate;

// import javax.net.ssl.*;
// import java.math.BigDecimal;
// import java.security.KeyManagementException;
// import java.security.NoSuchAlgorithmException;
// import java.security.cert.X509Certificate;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.stream.Collectors;

// @Service
// public class AIChatService {
    
//     private static final Logger logger = LoggerFactory.getLogger(AIChatService.class);

//     @Value("${openai.api.key}")
//     private String openaiApiKey;

//     @Value("${openai.api.url}")
//     private String openaiApiUrl;

//     @Value("${openai.model}")
//     private String model;

//     @Autowired
//     private InitiativeRepository initiativeRepository;

//     @Autowired
//     private UserRepository userRepository;

//     private final RestTemplate restTemplate;
//     private final ObjectMapper objectMapper = new ObjectMapper();

//     // Constructor to initialize RestTemplate with SSL bypass
//     public AIChatService() {
//         this.restTemplate = createRestTemplateWithSSLBypass();
//     }

//     /**
//      * Main method to handle chat requests
//      */
//     public ChatResponse processChat(String userMessage) {
//         try {
//             logger.info("Processing chat message: {}", userMessage);

//             // Step 1: Analyze the question and fetch relevant database data
//             String databaseContext = fetchDatabaseContext(userMessage);

//             // Step 2: Build the prompt with database context
//             String systemPrompt = buildSystemPrompt();
//             String userPrompt = buildUserPrompt(userMessage, databaseContext);

//             // Step 3: Call OpenAI API
//             String aiResponse = callOpenAI(systemPrompt, userPrompt);

//             logger.info("AI Response generated successfully");
//             return new ChatResponse(aiResponse, true);

//         } catch (Exception e) {
//             logger.error("Error processing chat: ", e);
//             return new ChatResponse(
//                 "I apologize, but I encountered an error while processing your request. Please try again.",
//                 false,
//                 e.getMessage()
//             );
//         }
//     }

//     /**
//      * Fetch relevant database context based on user's question
//      */
//     private String fetchDatabaseContext(String userMessage) {
//         StringBuilder context = new StringBuilder();
//         String lowerMessage = userMessage.toLowerCase();

//         // Fetch Initiatives Data
//         if (containsKeywords(lowerMessage, "initiative", "project", "count", "how many", "total", "status", "savings")) {
//             List<Initiative> initiatives = initiativeRepository.findAll();
//             context.append(buildInitiativesContext(initiatives, lowerMessage));
//         }

//         // Fetch Users Data
//         if (containsKeywords(lowerMessage, "user", "employee", "team", "people", "site", "discipline")) {
//             List<User> users = userRepository.findAll();
//             context.append(buildUsersContext(users));
//         }

//         // If no specific data found, provide general stats
//         if (context.length() == 0) {
//             context.append(buildGeneralStats());
//         }

//         return context.toString();
//     }

//     /**
//      * Build context from initiatives data
//      */
//     private String buildInitiativesContext(List<Initiative> initiatives, String query) {
//         StringBuilder context = new StringBuilder("\n\n=== INITIATIVES DATA ===\n");

//         // Total count
//         context.append(String.format("Total Initiatives: %d\n\n", initiatives.size()));

//         // Group by site
//         Map<String, List<Initiative>> bySite = initiatives.stream()
//             .collect(Collectors.groupingBy(Initiative::getSite));
        
//         context.append("BY SITE:\n");
//         bySite.forEach((site, list) -> {
//             context.append(String.format("- %s: %d initiatives\n", site, list.size()));
//         });

//         // Group by status
//         Map<String, List<Initiative>> byStatus = initiatives.stream()
//             .collect(Collectors.groupingBy(Initiative::getStatus));
        
//         context.append("\nBY STATUS:\n");
//         byStatus.forEach((status, list) -> {
//             context.append(String.format("- %s: %d initiatives\n", status, list.size()));
//         });

//         // Group by discipline
//         Map<String, List<Initiative>> byDiscipline = initiatives.stream()
//             .collect(Collectors.groupingBy(Initiative::getDiscipline));
        
//         context.append("\nBY DISCIPLINE:\n");
//         byDiscipline.forEach((discipline, list) -> {
//             context.append(String.format("- %s: %d initiatives\n", discipline, list.size()));
//         });

//         // Group by priority
//         Map<String, List<Initiative>> byPriority = initiatives.stream()
//             .collect(Collectors.groupingBy(Initiative::getPriority));
        
//         context.append("\nBY PRIORITY:\n");
//         byPriority.forEach((priority, list) -> {
//             context.append(String.format("- %s: %d initiatives\n", priority, list.size()));
//         });

//         // Calculate total savings
//         BigDecimal totalExpected = initiatives.stream()
//             .map(Initiative::getExpectedSavings)
//             .filter(s -> s != null)
//             .reduce(BigDecimal.ZERO, BigDecimal::add);
        
//         BigDecimal totalActual = initiatives.stream()
//             .map(Initiative::getActualSavings)
//             .filter(s -> s != null)
//             .reduce(BigDecimal.ZERO, BigDecimal::add);

//         context.append(String.format("\nFINANCIAL IMPACT:\n"));
//         context.append(String.format("- Total Expected Savings: %.2f\n", totalExpected));
//         context.append(String.format("- Total Actual Savings: %.2f\n", totalActual));

//         // If asking about specific site, add detailed info
//         for (String site : bySite.keySet()) {
//             if (query.contains(site.toLowerCase())) {
//                 context.append(String.format("\n\nDETAILED INFO FOR %s SITE:\n", site));
//                 List<Initiative> siteInitiatives = bySite.get(site);
                
//                 for (int i = 0; i < Math.min(5, siteInitiatives.size()); i++) {
//                     Initiative init = siteInitiatives.get(i);
//                     context.append(String.format("%d. %s (Status: %s, Priority: %s, Expected Savings: %.2f)\n",
//                         i + 1, init.getTitle(), init.getStatus(), init.getPriority(),
//                         init.getExpectedSavings() != null ? init.getExpectedSavings() : BigDecimal.ZERO));
//                 }
//             }
//         }

//         return context.toString();
//     }

//     /**
//      * Build context from users data
//      */
//     private String buildUsersContext(List<User> users) {
//         StringBuilder context = new StringBuilder("\n\n=== USERS DATA ===\n");
        
//         context.append(String.format("Total Users: %d\n\n", users.size()));

//         // Group by site
//         Map<String, List<User>> bySite = users.stream()
//             .collect(Collectors.groupingBy(User::getSite));
        
//         context.append("BY SITE:\n");
//         bySite.forEach((site, list) -> {
//             context.append(String.format("- %s: %d users\n", site, list.size()));
//         });

//         // Group by discipline
//         Map<String, List<User>> byDiscipline = users.stream()
//             .collect(Collectors.groupingBy(User::getDiscipline));
        
//         context.append("\nBY DISCIPLINE:\n");
//         byDiscipline.forEach((discipline, list) -> {
//             context.append(String.format("- %s: %d users\n", discipline, list.size()));
//         });

//         // Group by role
//         Map<String, List<User>> byRole = users.stream()
//             .collect(Collectors.groupingBy(User::getRole));
        
//         context.append("\nBY ROLE:\n");
//         byRole.forEach((role, list) -> {
//             context.append(String.format("- %s: %d users\n", role, list.size()));
//         });

//         return context.toString();
//     }

//     /**
//      * Build general statistics
//      */
//     private String buildGeneralStats() {
//         StringBuilder context = new StringBuilder("\n\n=== OPEX HUB OVERVIEW ===\n");
        
//         long initiativeCount = initiativeRepository.count();
//         long userCount = userRepository.count();

//         context.append(String.format("Total Initiatives: %d\n", initiativeCount));
//         context.append(String.format("Total Users: %d\n", userCount));
//         context.append("\nAvailable Sites: NDS, DHJ, HSD, APL, TCD, CORP\n");
//         context.append("Available Disciplines: Operation, Engineering & Utility, Environment, Safety, Quality, Others\n");

//         return context.toString();
//     }

//     /**
//      * Build system prompt for AI
//      */
//     private String buildSystemPrompt() {
//         return "You are OpEx Hub AI Assistant, a specialized AI for the Operational Excellence Management System of a chemical manufacturing company. " +
//                "\n\nYour role:" +
//                "\n- Answer ONLY questions about the OpEx Hub data provided to you" +
//                "\n- Provide clear, accurate insights based on the database data" +
//                "\n- Use a professional yet friendly tone" +
//                "\n- Format numbers with proper separators and currency symbols" +
//                "\n- Provide actionable recommendations when appropriate" +
//                "\n- If the user asks about something NOT in the provided data, politely say you can only help with OpEx Hub data" +
//                "\n\nIMPORTANT: Do NOT answer generic questions. Only respond based on the OpEx Hub database context provided.";
//     }

//     /**
//      * Build user prompt with database context
//      */
//     private String buildUserPrompt(String userMessage, String databaseContext) {
//         return "DATABASE CONTEXT:\n" + databaseContext + 
//                "\n\n---\n\nUSER QUESTION: " + userMessage +
//                "\n\nPlease answer the user's question using ONLY the database context provided above. " +
//                "Be specific with numbers and provide insights where relevant.";
//     }

//     /**
//      * Call OpenAI API
//      */
//     private String callOpenAI(String systemPrompt, String userPrompt) {
//         try {
//             // Prepare headers
//             HttpHeaders headers = new HttpHeaders();
//             headers.setContentType(MediaType.APPLICATION_JSON);
//             headers.setBearerAuth(openaiApiKey);

//             // Prepare messages
//             List<OpenAIMessage> messages = new ArrayList<>();
//             messages.add(new OpenAIMessage("system", systemPrompt));
//             messages.add(new OpenAIMessage("user", userPrompt));

//             // Prepare request
//             OpenAIRequest request = new OpenAIRequest(model, messages, 0.7, 800);

//             HttpEntity<OpenAIRequest> entity = new HttpEntity<>(request, headers);

//             // Call API
//             ResponseEntity<OpenAIResponse> response = restTemplate.exchange(
//                 openaiApiUrl,
//                 HttpMethod.POST,
//                 entity,
//                 OpenAIResponse.class
//             );

//             // Extract response
//             if (response.getBody() != null && 
//                 response.getBody().getChoices() != null && 
//                 !response.getBody().getChoices().isEmpty()) {
//                 return response.getBody().getChoices().get(0).getMessage().getContent();
//             }

//             return "I apologize, but I couldn't generate a response. Please try again.";

//         } catch (Exception e) {
//             logger.error("Error calling OpenAI API: ", e);
//             throw new RuntimeException("Failed to get AI response: " + e.getMessage());
//         }
//     }

//     /**
//      * Helper method to check if message contains any of the keywords
//      */
//     private boolean containsKeywords(String message, String... keywords) {
//         for (String keyword : keywords) {
//             if (message.contains(keyword.toLowerCase())) {
//                 return true;
//             }
//         }
//         return false;
//     }

//     /**
//      * Create RestTemplate with SSL certificate validation bypass
//      * This is necessary for environments where SSL certificates are not properly configured
//      */
//     private RestTemplate createRestTemplateWithSSLBypass() {
//         try {
//             // Create a trust manager that does not validate certificate chains
//             TrustManager[] trustAllCerts = new TrustManager[]{
//                 new X509TrustManager() {
//                     public X509Certificate[] getAcceptedIssuers() {
//                         return null;
//                     }
//                     public void checkClientTrusted(X509Certificate[] certs, String authType) {
//                     }
//                     public void checkServerTrusted(X509Certificate[] certs, String authType) {
//                     }
//                 }
//             };

//             // Install the all-trusting trust manager
//             SSLContext sslContext = SSLContext.getInstance("TLS");
//             sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            
//             // Create an ssl socket factory with our all-trusting manager
//             SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

//             // Set default SSL socket factory and hostname verifier
//             HttpsURLConnection.setDefaultSSLSocketFactory(sslSocketFactory);
//             HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

//             logger.info("SSL certificate validation bypass enabled for OpenAI API connection");
            
//             return new RestTemplate();
            
//         } catch (NoSuchAlgorithmException | KeyManagementException e) {
//             logger.error("Failed to create RestTemplate with SSL bypass: ", e);
//             // Fallback to default RestTemplate if SSL bypass fails
//             return new RestTemplate();
//         }
//     }
// }
