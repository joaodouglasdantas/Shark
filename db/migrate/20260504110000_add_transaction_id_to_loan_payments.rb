class AddTransactionIdToLoanPayments < ActiveRecord::Migration[7.1]
  def change
    add_reference :loan_payments, :transaction, null: true, foreign_key: true
  end
end
