class TransactionsController < ApplicationController
  before_action :set_transaction, only: %i[show edit update destroy]

  PER_PAGE = 25

  def index
    scope = current_user.transactions.includes(:category).recent
    scope = scope.where(kind: params[:kind])               if Transaction::KINDS.include?(params[:kind])
    scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?

    @total_count  = scope.count
    @total_pages  = [(@total_count / PER_PAGE.to_f).ceil, 1].max
    @current_page = params[:page].to_i.clamp(1, @total_pages)
    @transactions = scope.limit(PER_PAGE).offset((@current_page - 1) * PER_PAGE)
  end

  def show
  end

  def new
    @transaction = current_user.transactions.new(date: Date.current, kind: "expense")
    ensure_has_categories!
  end

  def edit
    ensure_has_categories!
  end

  def create
    @transaction = current_user.transactions.new(transaction_params)
    if @transaction.save
      redirect_to transactions_path, notice: "Lançamento registrado."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @transaction.update(transaction_params)
      redirect_to transactions_path, notice: "Lançamento atualizado."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @transaction.destroy
    redirect_to transactions_path, notice: "Lançamento removido.", status: :see_other
  end

  private

  def set_transaction
    @transaction = current_user.transactions.find(params[:id])
  end

  def transaction_params
    params.require(:transaction).permit(:amount, :kind, :description, :date, :category_id)
  end

  def ensure_has_categories!
    return if current_user.categories.exists?

    redirect_to new_category_path, alert: "Crie pelo menos uma categoria antes de lançar."
  end
end
