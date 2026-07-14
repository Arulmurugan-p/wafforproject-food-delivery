FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY order-service/pom.xml order-service/
RUN mvn dependency:go-offline -B -f order-service/pom.xml
COPY order-service/src order-service/src
RUN mvn package -DskipTests -f order-service/pom.xml

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/order-service/target/order-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
