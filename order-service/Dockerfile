# Use Java 17 base image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (layer caching)
RUN chmod +x mvnw && ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose application port
EXPOSE 8080

# Run the Spring Boot app
CMD ["java", "-jar", "target/order-service-0.0.1-SNAPSHOT.jar"]
