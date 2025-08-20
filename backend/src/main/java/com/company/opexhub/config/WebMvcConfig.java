package com.company.opexhub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import org.springframework.core.convert.converter.Converter;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToYearMonthConverter());
        registry.addConverter(new YearMonthToStringConverter());
    }

    public static class StringToYearMonthConverter implements Converter<String, YearMonth> {
        @Override
        public YearMonth convert(String source) {
            return YearMonth.parse(source, DateTimeFormatter.ofPattern("yyyy-MM"));
        }
    }

    public static class YearMonthToStringConverter implements Converter<YearMonth, String> {
        @Override
        public String convert(YearMonth source) {
            return source.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }
    }
}