package com.ssafy.s14p11a707.security.evaluator;

import java.io.Serializable;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class PermissionEvaluatorImpl implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (isUnauthenticated(authentication)) {
            return false;
        }

        if (isAdmin(authentication)) {
            return true;
        }

        if (targetType == null || permission == null) {
            return false;
        }

        String normalizedType = targetType.toUpperCase();
        String normalizedPermission = permission.toString().toUpperCase();
        if (!"READ".equals(normalizedPermission) && !"WRITE".equals(normalizedPermission)) {
            return false;
        }

        return "AUTHENTICATED".equals(normalizedType);
    }

    private boolean isUnauthenticated(Authentication authentication) {
        if (authentication == null) {
            return true;
        }
        if (!authentication.isAuthenticated()) {
            return true;
        }
        return authentication instanceof AnonymousAuthenticationToken;
    }

    private boolean isAdmin(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_ADMIN".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}

