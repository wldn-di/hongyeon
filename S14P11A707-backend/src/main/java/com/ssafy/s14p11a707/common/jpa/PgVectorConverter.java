package com.ssafy.s14p11a707.common.jpa;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PgVectorConverter implements AttributeConverter<float[], String> {

    @Override
    public String convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) return null;
        if (attribute.length == 0) return "[]";

        StringBuilder sb = new StringBuilder(attribute.length * 8).append('[');
        for (int i = 0; i < attribute.length; i++) {
            if (i > 0) sb.append(',');

            float value = attribute[i];
            if (Float.isNaN(value) || Float.isInfinite(value)) {
                throw new IllegalArgumentException("pgvector does not support NaN/Infinity");
            }
            sb.append(value);
        }
        return sb.append(']').toString();
    }

    @Override
    public float[] convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        String s = dbData.trim();
        if (s.isEmpty()) return new float[0];

        if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("(") && s.endsWith(")"))) {
            s = s.substring(1, s.length() - 1).trim();
        }

        if (s.isEmpty()) return new float[0];

        String[] parts = s.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }
}