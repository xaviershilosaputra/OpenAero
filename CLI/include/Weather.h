#ifndef WEATHER_H
#define WEATHER_H

#include <string>
#include <fstream>
#include <iostream>
#include "NetworkManager.h"
#include "nlohmann/json.hpp"

using json = nlohmann::json;

class Weather {
private:
    std::string icao;
    std::string desc;
    std::string temp;

public:
    Weather(std::string code) : icao(code), desc("Unknown"), temp("N/A") {
        std::string url = "https://wttr.in/" + icao + "?format=j1";
        std::string rawData = NetworkManager::fetch(url);

        if (!rawData.empty()) {
            try {
                auto data = json::parse(rawData);
                
                if (data.contains("current_condition") && !data["current_condition"].empty()) {
                    auto& condition = data["current_condition"][0];
                    
                    temp = condition.value("temp_C", "N/A");
                    
                    if (condition.contains("weatherDesc") && !condition["weatherDesc"].empty()) {
                        desc = condition["weatherDesc"][0].value("value", "Unknown");
                    }
                }
            } catch (const std::exception& e) {
                desc = "Parse Error: Check ICAO format";
            }
        } else {
            desc = "Offline / Connection Failed";
        }
    }

    void display() {
        std::cout << "\n\033[1;33m[LIVE WEATHER: " << icao << "]\033[0m" << std::endl;
        std::cout << "TEMPERATURE: " << temp << "°C" << std::endl;
        std::cout << "CONDITIONS:  " << desc << std::endl;
        std::cout << "SOURCE:      wttr.in (Live API)" << std::endl;
        std::cout << "--------------------------" << std::endl;
    }

    void saveReport() {
        std::string filename = icao + "_weather.txt";
        std::ofstream file(filename);
        if (file.is_open()) {
            file << "OpenAero Weather Report\n";
            file << "-----------------------\n";
            file << "ICAO/CITY:   " << icao << "\n";
            file << "TEMPERATURE: " << temp << "°C\n";
            file << "CONDITIONS:  " << desc << "\n";
            file << "GENERATED:   " << __DATE__ << "\n";
            file.close();
            std::cout << "\033[1;32m[SUCCESS]\033[0m Weather log saved to: " << filename << std::endl;
        }
    }
};

#endif
