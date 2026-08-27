package com.paddyai;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class PaddyAiApplication {
    public static void main(String[] args){
        SpringApplication.run(PaddyAiApplication.class,args);
        System.out.println("\n╔═══════════════════════════════════════╗");
        System.out.println("║  Paddy AI Backend Started ✅          ║");
        System.out.println("║  http://localhost:8080                ║");
        System.out.println("╚═══════════════════════════════════════╝\n");
    }
}
