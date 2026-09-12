import pandas as pd
import numpy as np
import time
from sklearn.model_selection import KFold
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Load data
df = pd.read_csv("data/household_15min.csv")

# Feature engineering
df["timestamp"] = pd.to_datetime(df["timestamp"])
df["hour"] = df["timestamp"].dt.hour
df["minute"] = df["timestamp"].dt.minute
df["tick_of_day"] = df["hour"] * 4 + df["minute"] // 15
df["sin_time"] = np.sin(2 * np.pi * df["tick_of_day"] / 96)
df["cos_time"] = np.cos(2 * np.pi * df["tick_of_day"] / 96)

# Lag features per participant (next-step prediction or auto-regressive)
df = df.sort_values(by=["participant_id", "timestamp"]).reset_index(drop=True)
df["lag1_load"] = df.groupby("participant_id")["load_kw"].shift(1).bfill()
df["lag1_gen"] = df.groupby("participant_id")["gen_kw"].shift(1).bfill()

# Participant one-hot encoding
features = ["hour", "minute", "tick_of_day", "sin_time", "cos_time", "lag1_load", "lag1_gen"]
df_encoded = pd.get_dummies(df, columns=["participant_id"], drop_first=False)
participant_cols = [c for c in df_encoded.columns if c.startswith("participant_id_")]
X = df_encoded[features + participant_cols]

y_load = df_encoded["load_kw"]
y_gen = df_encoded["gen_kw"]

def evaluate_models(target_name, y):
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    rf_maes, rf_rmses, rf_r2s = [], [], []
    xgb_maes, xgb_rmses, xgb_r2s = [], [], []
    
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    xgb = XGBRegressor(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42)
    
    start_rf = time.time()
    for train_idx, test_idx in kf.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        rf.fit(X_train, y_train)
        pred_rf = rf.predict(X_test)
        rf_maes.append(mean_absolute_error(y_test, pred_rf))
        rf_rmses.append(np.sqrt(mean_squared_error(y_test, pred_rf)))
        rf_r2s.append(r2_score(y_test, pred_rf))
    rf_time = (time.time() - start_rf) / 5

    start_xgb = time.time()
    for train_idx, test_idx in kf.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        xgb.fit(X_train, y_train)
        pred_xgb = xgb.predict(X_test)
        xgb_maes.append(mean_absolute_error(y_test, pred_xgb))
        xgb_rmses.append(np.sqrt(mean_squared_error(y_test, pred_xgb)))
        xgb_r2s.append(r2_score(y_test, pred_xgb))
    xgb_time = (time.time() - start_xgb) / 5

    print(f"=== Target: {target_name} ===")
    print(f"Random Forest -> MAE: {np.mean(rf_maes):.4f} kW | RMSE: {np.mean(rf_rmses):.4f} kW | R2: {np.mean(rf_r2s):.4f} | Avg Train Time: {rf_time*1000:.1f}ms")
    print(f"XGBoost       -> MAE: {np.mean(xgb_maes):.4f} kW | RMSE: {np.mean(xgb_rmses):.4f} kW | R2: {np.mean(xgb_r2s):.4f} | Avg Train Time: {xgb_time*1000:.1f}ms")
    print()

evaluate_models("load_kw (Demand)", y_load)
evaluate_models("gen_kw (Solar Generation)", y_gen)
