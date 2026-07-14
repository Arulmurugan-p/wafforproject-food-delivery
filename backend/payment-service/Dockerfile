FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY payment-service/pom.xml payment-service/
RUN mvn dependency:go-offline -B -f payment-service/pom.xml
COPY payment-service/src payment-service/src
RUN mvn package -DskipTests -f payment-service/pom.xml

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/payment-service/target/payment-service-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
