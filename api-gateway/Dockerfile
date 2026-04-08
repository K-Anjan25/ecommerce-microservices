FROM eclipse-temurin:17-jre-alpine
EXPOSE 8889
COPY target/*.jar api-gateway.jar
ENTRYPOINT ["java","-jar","/api-gateway.jar"]