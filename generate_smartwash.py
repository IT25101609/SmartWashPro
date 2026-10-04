import os

base_dir = r"c:\Users\pc\Desktop\Smartwash Pro"
backend_dir = os.path.join(base_dir, "backend")
db_dir = os.path.join(base_dir, "database")

directories = [
    "src/main/java/com/smartwashpro/config",
    "src/main/java/com/smartwashpro/controller",
    "src/main/java/com/smartwashpro/service",
    "src/main/java/com/smartwashpro/repository",
    "src/main/java/com/smartwashpro/model/enums",
    "src/main/java/com/smartwashpro/dto/request",
    "src/main/java/com/smartwashpro/dto/response",
    "src/main/java/com/smartwashpro/mapper",
    "src/main/java/com/smartwashpro/security",
    "src/main/java/com/smartwashpro/exception",
    "src/main/java/com/smartwashpro/util",
    "src/main/resources"
]

for d in directories:
    os.makedirs(os.path.join(backend_dir, d), exist_ok=True)
os.makedirs(db_dir, exist_ok=True)

files = {}

files["pom.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.smartwashpro</groupId>
    <artifactId>smartwash-pro-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>smartwash-pro-backend</name>
    <description>SmartWash Pro Backend</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
"""

files["src/main/resources/application.properties"] = """spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/smartwash_pro?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true
app.jwt.secret=${JWT_SECRET:SmartWashProSecretKey2024VeryLongSecureKeyForJWT}
app.jwt.expiration=${JWT_EXPIRATION_MS:86400000}
server.port=8080
spring.jackson.serialization.write-dates-as-timestamps=false
"""

files["src/main/java/com/smartwashpro/SmartWashProApplication.java"] = """package com.smartwashpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartWashProApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartWashProApplication.class, args);
    }
}
"""

for filepath, content in files.items():
    full_path = os.path.join(backend_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"BACKEND BUILD PARTIALLY COMPLETE via script — Basic files written to {backend_dir}")
