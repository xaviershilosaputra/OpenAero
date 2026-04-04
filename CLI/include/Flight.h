#ifndef FLIGHT_H
#define FLIGHT_H

#include <string>
#include <fstream>
#include <iostream>
#include <algorithm>
#include "nlohmann/json.hpp"

using json = nlohmann::json;

class Flight {
private:
    std::string ident, origin, destination, status, airline;

public:
    Flight() : ident("N/A"), origin("???"), destination("???"), status("NONE"), airline("N/A") {}

    Flight(std::string id, std::string dep, std::string arr, std::string stat, std::string air = "N/A") 
        : ident(id), origin(dep), destination(arr), status(stat), airline(air) {}

    static Flight fromJson(const std::string& jsonData) {
        try {
            auto data = json::parse(jsonData);
            
            if (data.contains("data") && data["data"].is_array() && !data["data"].empty()) {
                auto f = data["data"][0];
                
                return Flight(
                    f["flight"].value("iata", "N/A"),
                    f["departure"].value("airport", "Unknown"),
                    f["arrival"].value("airport", "Unknown"),
                    f.value("flight_status", "unknown"),
                    f["airline"].value("name", "Unknown Airline")
                );
            }
        } catch (...) {}
        return Flight("N/A", "Unknown", "Unknown", "NOT_FOUND", "N/A");
    }

    void printTelemetry() {
        if (status == "NOT_FOUND") {
            std::cout << "\n\033[1;31m[!] API returned no results for this ID.\033[0m" << std::endl;
            std::cout << "\033[90mPossible reasons:\033[0m" << std::endl;
            std::cout << " - Flight is not currently in the air (Active)" << std::endl;
            std::cout << " - Aviationstack free tier limit reached" << std::endl;
            std::cout << " - Incorrect Flight Number format" << std::endl;
            return;
        }

        std::cout << "\n\033[1;33m[LIVE RADAR DATA: " << ident << "]\033[0m" << std::endl;
        std::cout << "AIRLINE:  " << airline << std::endl;
        std::cout << "ROUTE:    " << origin << " -> " << destination << std::endl;
        
        std::string displayStatus = status;
        std::transform(displayStatus.begin(), displayStatus.end(), displayStatus.begin(), ::toupper);
        
        std::cout << "STATUS:   \033[1;32m" << displayStatus << "\033[0m" << std::endl;
        std::cout << "--------------------------" << std::endl;
    }

    void saveReport() {
        std::string filename = ident + "_report.txt";
        std::ofstream file(filename);
        if (file.is_open()) {
            file << "OpenAero Flight Report\n";
            file << "----------------------\n";
            file << "IDENT:    " << ident << "\n";
            file << "AIRLINE:  " << airline << "\n";
            file << "ROUTE:    " << origin << " -> " << destination << "\n";
            file << "STATUS:   " << status << "\n";
            file << "GENERATED: " << __DATE__ << " " << __TIME__ << "\n";
            file.close();
            std::cout << "\033[1;32m[SUCCESS]\033[0m Report saved to: " << filename << std::endl;
        } else {
            std::cout << "\033[1;31m[ERROR]\033[0m Could not create file." << std::endl;
        }
    }
};

#endif
