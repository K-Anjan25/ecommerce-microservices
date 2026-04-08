FROM eclipse-temurin:17-jre-alpine
COPY target/*.jar notification-service.jar
ENTRYPOINT ["java","-jar","/notification-service.jar"]