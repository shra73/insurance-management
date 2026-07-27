"""Add missing foreign key indexes

Revision ID: 9e517ef6732a
Revises: b01fe3add8c1
Create Date: 2026-07-27 17:08:25.020930

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9e517ef6732a'
down_revision = 'b01fe3add8c1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('ix_policies_customer_id', 'policies', ['customer_id'])
    op.create_index('ix_premium_payments_policy_id', 'premium_payments', ['policy_id'])
    op.create_index('ix_claims_policy_id', 'claims', ['policy_id'])
    op.create_index('ix_documents_policy_id', 'documents', ['policy_id'])
    op.create_index('ix_documents_uploaded_by', 'documents', ['uploaded_by'])
    op.create_index('ix_premium_reminders_policy_id', 'premium_reminders', ['policy_id'])


def downgrade():
    op.drop_index('ix_policies_customer_id', table_name='policies')
    op.drop_index('ix_premium_payments_policy_id', table_name='premium_payments')
    op.drop_index('ix_claims_policy_id', table_name='claims')
    op.drop_index('ix_documents_policy_id', table_name='documents')
    op.drop_index('ix_documents_uploaded_by', table_name='documents')
    op.drop_index('ix_premium_reminders_policy_id', table_name='premium_reminders')