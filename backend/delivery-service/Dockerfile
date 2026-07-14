FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY delivery-service/pom.xml delivery-service/
RUN mvn dependency:go-offline -B -f delivery-service/pom.xml
COPY delivery-service/src delivery-service/src
RUN mvn package -DskipTests -f delivery-service/pom.xml

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/delivery-service/target/delivery-service-1.0.0.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
