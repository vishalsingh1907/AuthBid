"""
SIH26100 — Role-Based Access Control (RBAC) Module
Enforces distinct permissions for:
- officer: Evaluation / Procurement Officer (full decision rights, show cause, disqualification)
- committee_member: Scrutiny / Review Committee Member (advisory review, notes, audit inspection)
- admin: System Administrator / CVO (tamper simulation, restore, anchoring, user management)
"""
from enum import Enum
from typing import List, Optional
from fastapi import Header, HTTPException, Depends, status


class UserRole(str, Enum):
    OFFICER = "officer"
    COMMITTEE_MEMBER = "committee_member"
    ADMIN = "admin"


def get_current_user_role(x_user_role: Optional[str] = Header(default="officer")) -> UserRole:
    """
    Extracts the user's role from the X-User-Role header.
    Defaults to 'officer' in development if unprovided.
    """
    if not x_user_role:
        return UserRole.OFFICER

    try:
        return UserRole(x_user_role.strip().lower())
    except ValueError:
        valid_roles = [r.value for r in UserRole]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid X-User-Role '{x_user_role}'. Permitted roles: {valid_roles}",
        )


def require_roles(allowed_roles: List[UserRole]):
    """FastAPI dependency factory enforcing role requirements."""
    def role_checker(role: UserRole = Depends(get_current_user_role)) -> UserRole:
        if role not in allowed_roles:
            valid_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Forbidden: Action restricted under GFR 2017 & GeM policy. "
                    f"Requires role in {valid_names}, but active role is '{role.value}'."
                ),
            )
        return role

    return role_checker
