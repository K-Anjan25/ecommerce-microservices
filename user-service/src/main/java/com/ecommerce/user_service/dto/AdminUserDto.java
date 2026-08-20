package com.ecommerce.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
public class AdminUserDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private boolean active;
    private boolean locked;
    private Date joinDate;
    private Date lastLoginDate;
    private String profileImageUrl;
}